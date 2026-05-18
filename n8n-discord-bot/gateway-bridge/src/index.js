// Discord Gateway -> n8n webhook bridge
// Listens to Discord Gateway events and forwards them to n8n webhooks
// so n8n workflows can react to messages, member joins, reactions, etc.

import 'dotenv/config';
import http from 'node:http';
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} from 'discord.js';
import { fetch } from 'undici';

const REQUIRED_ENV = ['DISCORD_BOT_TOKEN', 'N8N_WEBHOOK_BASE'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[fatal] missing env var: ${key}`);
    process.exit(1);
  }
}

const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE.replace(/\/$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '';

// MessageContent and GuildMembers are privileged intents that must be
// explicitly enabled in the Discord Developer Portal for the bot
// application. GuildPresences is also privileged but the bridge does not
// listen to presence updates, so it has been removed to reduce the
// privileged-intent surface area.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

// Bound how long a single forward can wait for n8n. Without this, undici's
// default header timeout (~5min) would let pending forwards pile up if n8n
// stalls, slowly leaking memory on a busy guild.
const FORWARD_TIMEOUT_MS = Number(process.env.FORWARD_TIMEOUT_MS || 15000);

async function forward(eventPath, payload) {
  const url = `${N8N_WEBHOOK_BASE}/webhook/${eventPath}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(BRIDGE_SECRET ? { 'x-bridge-secret': BRIDGE_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(
        `[forward] ${eventPath} -> ${url} returned ${res.status}`,
      );
    }
    // undici requires the body be consumed/cancelled before the socket is
    // returned to the pool. Without this, MESSAGE_CREATE fanout will exhaust
    // the connection pool on a busy guild and subsequent forwards will stall.
    await res.body?.cancel().catch(() => null);
  } catch (err) {
    console.error(`[forward] ${eventPath} failed:`, err.message);
  }
}

async function fanout(eventPaths, payload) {
  await Promise.all(eventPaths.map((p) => forward(p, payload)));
}

// Each MESSAGE_CREATE event is fanned out to multiple workflows (AI mention
// handler, auto-moderation, XP, cross-posting). n8n cannot share a single
// webhook path across active workflows, so we use one unique path per consumer.
const MESSAGE_CREATE_PATHS = [
  'discord/message-create/ai',
  'discord/message-create/mod',
  'discord/message-create/xp',
  'discord/message-create/cross',
];

function inGuild(guildId) {
  if (!GUILD_ID) return true;
  return guildId === GUILD_ID;
}

client.once(Events.ClientReady, (c) => {
  console.log(`[ready] logged in as ${c.user.tag} (id=${c.user.id})`);
  console.log(`[ready] forwarding events to ${N8N_WEBHOOK_BASE}/webhook/*`);
  if (GUILD_ID) console.log(`[ready] restricted to guild ${GUILD_ID}`);
});

client.on(Events.MessageCreate, async (msg) => {
  if (!msg.guild || !inGuild(msg.guildId)) return;
  if (msg.author.bot) return;

  await fanout(MESSAGE_CREATE_PATHS, {
    event: 'MESSAGE_CREATE',
    guildId: msg.guildId,
    channelId: msg.channelId,
    channelName: msg.channel?.name,
    messageId: msg.id,
    content: msg.content,
    author: {
      id: msg.author.id,
      username: msg.author.username,
      displayName: msg.member?.displayName ?? msg.author.username,
      bot: msg.author.bot,
      roles: msg.member?.roles?.cache?.map((r) => r.id) ?? [],
    },
    mentionsBot: msg.mentions.users.has(client.user.id),
    timestamp: msg.createdTimestamp,
  });
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (!inGuild(member.guild.id)) return;

  await forward('discord/member-join', {
    event: 'GUILD_MEMBER_ADD',
    guildId: member.guild.id,
    user: {
      id: member.id,
      username: member.user.username,
      displayName: member.displayName,
      avatarUrl: member.user.displayAvatarURL({ size: 256 }),
      createdAt: member.user.createdTimestamp,
    },
    memberCount: member.guild.memberCount,
    joinedAt: member.joinedTimestamp,
  });
});

// GuildMemberRemove (member-leave) intentionally not forwarded: no workflow
// consumes it right now and forwarding would produce a 404 per leave event.
// Re-add this handler when a goodbye / leave-log workflow is introduced.

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
  } catch (err) {
    console.warn('[reaction-add] failed to fetch partial:', err.message);
    return;
  }
  if (!reaction.message.guild || !inGuild(reaction.message.guildId)) return;
  if (user.bot) return;

  await forward('discord/reaction-add', {
    event: 'MESSAGE_REACTION_ADD',
    guildId: reaction.message.guildId,
    channelId: reaction.message.channelId,
    messageId: reaction.message.id,
    emoji: {
      id: reaction.emoji.id,
      name: reaction.emoji.name,
      animated: reaction.emoji.animated ?? false,
    },
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
    // MESSAGE_REACTION_REMOVE does not include a member object, so for uncached
    // users discord.js builds a partial User where `user.bot` is undefined.
    // Fetch the full user so the `user.bot` check below is reliable. The
    // MessageReactionAdd handler above doesn't need this because ADD events
    // include member data, which lets discord.js fully resolve the user.
    if (user.partial) await user.fetch();
  } catch {
    return;
  }
  if (!reaction.message.guild || !inGuild(reaction.message.guildId)) return;
  if (user.bot) return;

  await forward('discord/reaction-remove', {
    event: 'MESSAGE_REACTION_REMOVE',
    guildId: reaction.message.guildId,
    channelId: reaction.message.channelId,
    messageId: reaction.message.id,
    emoji: {
      id: reaction.emoji.id,
      name: reaction.emoji.name,
    },
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.guild || !inGuild(interaction.guildId)) return;

  if (interaction.isChatInputCommand()) {
    // Discord option types: 1 = SUB_COMMAND, 2 = SUB_COMMAND_GROUP
    // When the command uses a subcommand, the real options live nested inside.
    const topLevel = interaction.options.data;
    let optionEntries = topLevel;
    if (topLevel.length === 1 && (topLevel[0].type === 1 || topLevel[0].type === 2)) {
      const sub = topLevel[0];
      optionEntries = sub.type === 2 && sub.options?.[0]?.options
        ? sub.options[0].options
        : sub.options ?? [];
    }

    const options = {};
    for (const opt of optionEntries) {
      options[opt.name] = opt.value ?? opt.user?.id ?? opt.channel?.id ?? opt.role?.id ?? null;
    }

    // Send an ephemeral deferred response so the user sees "thinking..." only
    // to themselves. Workflows then PATCH /webhooks/{appId}/{token}/messages/@original
    // to replace the deferred reply with the real content (no orphaned message).
    // Deferred replies extend the response window from 3s to 15min, which is
    // important for multi-step workflows (ticket creation, polls with reactions).
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (err) {
      console.warn('[interaction] defer failed:', err.message);
    }

    // Route each top-level slash command to its own webhook path so n8n can
    // dispatch them to separate workflows without collisions.
    await forward(`discord/slash-command/${interaction.commandName}`, {
      event: 'INTERACTION_CREATE',
      commandName: interaction.commandName,
      subcommand: interaction.options.getSubcommand(false),
      subcommandGroup: interaction.options.getSubcommandGroup(false),
      options,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      interactionToken: interaction.token,
      applicationId: interaction.applicationId,
      user: {
        id: interaction.user.id,
        username: interaction.user.username,
        displayName: interaction.member?.displayName ?? interaction.user.username,
      },
    });
  }
});

client.on('error', (err) => {
  console.error('[client error]', err);
});

// Minimal HTTP health server so Fly.io can detect hung event loops, not just
// process exits. Returns 200 only when the Discord client is fully ready.
const HEALTH_PORT = Number(process.env.HEALTH_PORT || 8080);
const healthServer = http.createServer((req, res) => {
  if (req.url === '/healthz' || req.url === '/') {
    const ready = client.isReady();
    res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      ready,
      uptimeSeconds: Math.floor(process.uptime()),
      user: ready ? client.user?.tag : null,
    }));
    return;
  }
  res.writeHead(404).end();
});
healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`[health] listening on :${HEALTH_PORT}/healthz`);
});

async function shutdown(signal) {
  console.log(`[shutdown] ${signal} received, destroying client`);
  // Wait for the health server to stop accepting connections and for the
  // Discord client to disconnect cleanly before exiting. The fly.toml
  // kill_timeout is the backstop if either of these hangs.
  await new Promise((resolve) => healthServer.close(() => resolve()));
  try { await client.destroy(); } catch {}
  process.exit(0);
}

process.on('SIGTERM', () => { shutdown('SIGTERM').catch(() => process.exit(1)); });
process.on('SIGINT', () => { shutdown('SIGINT').catch(() => process.exit(1)); });

await client.login(process.env.DISCORD_BOT_TOKEN);

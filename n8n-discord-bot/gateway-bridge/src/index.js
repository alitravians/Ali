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
  PermissionFlagsBits,
} from 'discord.js';
import { fetch } from 'undici';
import {
  initSentry,
  captureException,
  installGlobalErrorHandlers,
  flushSentry,
} from './observability.js';

await initSentry();
installGlobalErrorHandlers();

// Coarse per-key rate limiter for Sentry reports. A misconfigured n8n
// webhook on a busy guild can produce tens of thousands of MESSAGE_CREATE
// fanout failures per minute — each one creating an event is wasteful
// of Sentry's quota (every report after the first communicates the same
// information: "this webhook is broken"). Emit at most once per key per
// ``SENTRY_REPORT_INTERVAL_MS`` window; subsequent failures still log to
// stdout normally.
//
// Operator notes:
//   - Number() returns NaN for non-numeric strings, and ``now - last <
//     NaN`` is always false, which would silently disable rate-limiting.
//     We guard with isFinite + non-negative and fall back to the 60s
//     default so a typo can't bypass the throttle.
//   - Setting this to 0 is an intentional escape hatch: useful during
//     active incident debugging when you want EVERY failure mirrored to
//     Sentry. Re-set to 60000 (or unset) when the incident is resolved
//     so a runaway webhook can't burn quota.
let SENTRY_REPORT_INTERVAL_MS = Number(
  process.env.SENTRY_REPORT_INTERVAL_MS || 60_000,
);
if (!Number.isFinite(SENTRY_REPORT_INTERVAL_MS) || SENTRY_REPORT_INTERVAL_MS < 0) {
  console.warn(
    `[sentry] SENTRY_REPORT_INTERVAL_MS='${process.env.SENTRY_REPORT_INTERVAL_MS}' is not a non-negative number; falling back to 60000ms`,
  );
  SENTRY_REPORT_INTERVAL_MS = 60_000;
}
const _sentryLastReport = new Map();
function shouldReportToSentry(key) {
  const now = Date.now();
  const last = _sentryLastReport.get(key) || 0;
  if (now - last < SENTRY_REPORT_INTERVAL_MS) return false;
  _sentryLastReport.set(key, now);
  // Bound the map so a long-running process can't accumulate entries for
  // every transient eventPath/status combination (each entry is tiny but
  // a leak is a leak). 1000 distinct keys is far beyond any realistic
  // workload — the bridge has ~20 event paths total.
  if (_sentryLastReport.size > 1000) {
    const cutoff = now - SENTRY_REPORT_INTERVAL_MS;
    for (const [k, t] of _sentryLastReport) {
      if (t < cutoff) _sentryLastReport.delete(k);
    }
  }
  return true;
}

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
// Parent channel ID for the staff ban-appeals area. Any message posted in a
// thread whose parentId === APPEALS_CHANNEL_ID is treated as a staff reply
// in an active appeal and routed to workflow 14 instead of the normal
// MESSAGE_CREATE fan-out (so the message isn't scanned for banned words or
// awarded XP). Empty string disables the routing entirely.
const APPEALS_CHANNEL_ID = process.env.APPEALS_CHANNEL_ID || '';

// MessageContent and GuildMembers are privileged intents that must be
// explicitly enabled in the Discord Developer Portal for the bot
// application. GuildPresences is also privileged but the bridge does not
// listen to presence updates, so it has been removed to reduce the
// privileged-intent surface area.
//
// DirectMessages is required so the bot receives MESSAGE_CREATE events when
// banned users reply to the appeal DM. DMs aren't restricted to one channel
// per session, hence Partials.Channel below to avoid the discord.js "cannot
// resolve DM channel" partial-fetch warning.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
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
      // n8n returning 4xx/5xx is the bridge's loudest "something is wrong"
      // signal — workflow disabled, webhook path renamed, n8n out of
      // memory. The payload itself is too noisy for Sentry's quota so we
      // only ship the routing metadata, and we rate-limit per
      // (eventPath, status) pair so a misconfigured webhook on a busy
      // guild can't burn Sentry quota at MESSAGE_CREATE volume.
      if (shouldReportToSentry(`n8n:${eventPath}:${res.status}`)) {
        captureException(
          new Error(`n8n webhook returned ${res.status}`),
          {
            n8n_event: eventPath,
            n8n_status: res.status,
            n8n_url: url,
          },
        );
      }
    }
    // undici requires the body be consumed/cancelled before the socket is
    // returned to the pool. Without this, MESSAGE_CREATE fanout will exhaust
    // the connection pool on a busy guild and subsequent forwards will stall.
    await res.body?.cancel().catch(() => null);
  } catch (err) {
    console.error(`[forward] ${eventPath} failed:`, err.message);
    // Network-level failure (DNS, timeout, connection refused). Distinct
    // from a 4xx/5xx response above — this means we never reached n8n
    // at all, which usually points to alitravians-n8n being down or a
    // Fly internal-network blip. Same rate-limit logic: when n8n is
    // hard-down, every fanout fails, so cap the Sentry spam.
    if (shouldReportToSentry(`n8n-network:${eventPath}:${err.code || err.name}`)) {
      captureException(err, { n8n_event: eventPath, n8n_url: url });
    }
  }
}

async function fanout(eventPaths, payload) {
  await Promise.all(eventPaths.map((p) => forward(p, payload)));
}

// Each MESSAGE_CREATE event is fanned out to multiple workflows (AI mention
// handler, auto-moderation, XP, cross-posting, stats counter). n8n cannot
// share a single webhook path across active workflows, so we use one unique
// path per consumer. The 'stats' fan-out lets workflow 09 own its own
// dailyCounters - $getWorkflowStaticData is per-workflow scoped, so the
// stats workflow cannot read counters from the XP workflow.
const MESSAGE_CREATE_PATHS = [
  'discord/message-create/ai',
  'discord/message-create/mod',
  'discord/message-create/xp',
  'discord/message-create/cross',
  'discord/message-create/stats',
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
  if (msg.author.bot) return;

  // DM branch: any non-bot message in a DM channel is routed to workflow 14
  // (ban-appeal). The workflow decides whether the author actually has an
  // open appeal and relays the message into the appeals thread, or replies
  // back with a "no open appeal" notice.
  if (!msg.guild) {
    // ChannelType.DM === 1. Ignore group DMs / unknown DM types.
    if (msg.channel?.type !== 1) return;
    await forward('discord/dm-message', {
      event: 'DM_MESSAGE_CREATE',
      channelId: msg.channelId,
      messageId: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
      },
      timestamp: msg.createdTimestamp,
    });
    return;
  }

  if (!inGuild(msg.guildId)) return;

  // Appeal-thread branch: messages posted inside a thread whose parent is
  // the staff appeals channel are not part of normal server chatter - they
  // are staff replies on an active appeal. Route them to workflow 14 only
  // and skip the AI/mod/xp/cross/stats fan-out so a staffer typing a banned
  // word in their reply doesn't get auto-moderated themselves.
  if (
    APPEALS_CHANNEL_ID &&
    msg.channel?.isThread?.() &&
    msg.channel.parentId === APPEALS_CHANNEL_ID
  ) {
    await forward('discord/appeal-thread-message', {
      event: 'APPEAL_THREAD_MESSAGE_CREATE',
      guildId: msg.guildId,
      threadId: msg.channelId,
      messageId: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        displayName: msg.member?.displayName ?? msg.author.username,
        roles: msg.member?.roles?.cache?.map((r) => r.id) ?? [],
      },
      timestamp: msg.createdTimestamp,
    });
    return;
  }

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

// GUILD_MEMBER_ADD is fanned out to the welcome workflow (which generates an
// AI greeting) and the stats workflow (which only bumps a join counter).
// Two paths instead of one keeps workflow 09's static data isolated and
// avoids coupling it to the welcome workflow's pipeline.
const MEMBER_JOIN_PATHS = [
  'discord/member-join',
  'discord/stats/member-join',
];

client.on(Events.GuildMemberAdd, async (member) => {
  if (!inGuild(member.guild.id)) return;

  await fanout(MEMBER_JOIN_PATHS, {
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
    // Forward the specific permission bits that downstream workflows need to
    // re-check server-side. Discord's setDefaultMemberPermissions hides
    // restricted commands from the slash menu, but a member with a manually
    // crafted interaction (or a misconfigured role override) could still
    // reach the webhook. n8n re-validates these flags as defense in depth.
    const perms = interaction.memberPermissions;
    const canManageMessages = perms?.has(PermissionFlagsBits.ManageMessages) ?? false;
    const canManageGuild = perms?.has(PermissionFlagsBits.ManageGuild) ?? false;
    const canBanMembers = perms?.has(PermissionFlagsBits.BanMembers) ?? false;

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
      permissions: {
        canManageMessages,
        canManageGuild,
        canBanMembers,
      },
    });
  }
});

client.on('error', (err) => {
  console.error('[client error]', err);
  // discord.js emits 'error' for gateway reconnect failures, shard
  // crashes, and unhandled exceptions inside event listeners. Without
  // capturing here they would only appear in Fly logs.
  captureException(err, { discord_event: 'client_error' });
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
  // Drain any buffered Sentry events before exit so a last-minute
  // forward() failure that happened during shutdown still reaches the
  // dashboard. flushSentry is a no-op when Sentry is disabled.
  await flushSentry(2000);
  process.exit(0);
}

process.on('SIGTERM', () => { shutdown('SIGTERM').catch(() => process.exit(1)); });
process.on('SIGINT', () => { shutdown('SIGINT').catch(() => process.exit(1)); });

await client.login(process.env.DISCORD_BOT_TOKEN);

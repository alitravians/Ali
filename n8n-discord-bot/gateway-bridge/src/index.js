// Discord Gateway -> n8n webhook bridge
// Listens to Discord Gateway events and forwards them to n8n webhooks
// so n8n workflows can react to messages, member joins, reactions, etc.

import 'dotenv/config';
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
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
    });
    if (!res.ok) {
      console.warn(
        `[forward] ${eventPath} -> ${url} returned ${res.status}`,
      );
    }
  } catch (err) {
    console.error(`[forward] ${eventPath} failed:`, err.message);
  }
}

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

  await forward('discord/message-create', {
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

client.on(Events.GuildMemberRemove, async (member) => {
  if (!inGuild(member.guild.id)) return;

  await forward('discord/member-leave', {
    event: 'GUILD_MEMBER_REMOVE',
    guildId: member.guild.id,
    user: {
      id: member.id,
      username: member.user.username,
      displayName: member.displayName,
    },
    memberCount: member.guild.memberCount,
  });
});

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
    const options = {};
    for (const opt of interaction.options.data) {
      options[opt.name] = opt.value ?? opt.user?.id ?? opt.channel?.id ?? null;
    }

    try {
      await interaction.deferReply({ ephemeral: false });
    } catch (err) {
      console.warn('[interaction] defer failed:', err.message);
    }

    await forward('discord/slash-command', {
      event: 'INTERACTION_CREATE',
      commandName: interaction.commandName,
      subcommand: interaction.options.getSubcommand(false),
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

process.on('SIGTERM', () => {
  console.log('[shutdown] SIGTERM received, destroying client');
  client.destroy();
  process.exit(0);
});

await client.login(process.env.DISCORD_BOT_TOKEN);

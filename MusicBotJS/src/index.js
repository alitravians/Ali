import { Client, Collection, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { generateDependencyReport } from '@discordjs/voice';
import { config, COLORS } from './config.js';
import { buildCommands } from './commands/index.js';
import { trackEmbed, plainEmbed } from './format.js';
import { getPlayer } from './player.js';

console.log('--- @discordjs/voice dependency report ---');
console.log(generateDependencyReport());
console.log('--- end report ---');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const playerOpts = {
  defaultVolume: config.defaultVolume,
  maxQueueLength: config.maxQueueLength,
  idleDisconnectSeconds: config.idleDisconnectSeconds,
};

const commands = buildCommands(playerOpts);
const commandMap = new Collection();
for (const c of commands) commandMap.set(c.data.name, c);

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag} (${readyClient.user.id})`);

  // Register slash commands. Guild-scoped registration is instant; we use it
  // when GUILD_ID is set to keep the same UX as the old Python bot.
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const body = commands.map((c) => c.data.toJSON());
    if (config.guildId && config.guildId !== '0') {
      await rest.put(Routes.applicationGuildCommands(readyClient.user.id, config.guildId), { body });
      console.log(`synced ${commands.length} guild commands to ${config.guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(readyClient.user.id), { body });
      console.log(`synced ${commands.length} global commands`);
    }
  } catch (err) {
    console.error('failed to sync commands:', err);
  }

  // Wire up per-guild "now playing" announcements.
  for (const guild of readyClient.guilds.cache.values()) {
    const player = getPlayer(guild.id, playerOpts);
    player.on('onTrackStart', (track) => {
      const ch = player.textChannel;
      if (!ch) return;
      ch.send({ embeds: [trackEmbed(track)] }).catch(() => {});
    });
    player.on('onTrackError', (track, err) => {
      const ch = player.textChannel;
      if (!ch) return;
      ch.send({
        embeds: [
          plainEmbed(
            COLORS.danger,
            '❌ فشل تشغيل أغنية',
            `${track?.title ?? 'unknown'}\n\`${err?.message ?? err}\``,
          ),
        ],
      }).catch(() => {});
    });
    player.on('onIdleDisconnect', () => {
      const ch = player.textChannel;
      if (!ch) return;
      ch.send({ embeds: [plainEmbed(COLORS.info, '💤 خرجت من القناة بسبب الخمول')] }).catch(() => {});
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(`command ${interaction.commandName} failed:`, err);
    const payload = { embeds: [plainEmbed(COLORS.danger, '❌ خطأ غير متوقع', err.message ?? String(err))] };
    if (interaction.deferred || interaction.replied) {
      interaction.followUp({ ...payload, ephemeral: true }).catch(() => {});
    } else {
      interaction.reply({ ...payload, ephemeral: true }).catch(() => {});
    }
  }
});

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});

client.login(config.token);

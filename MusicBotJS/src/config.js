import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_CONFIG_PATH = path.join(ROOT, 'server_config.json');

let serverConfig = {};
try {
  if (fs.existsSync(SERVER_CONFIG_PATH)) {
    serverConfig = JSON.parse(fs.readFileSync(SERVER_CONFIG_PATH, 'utf8'));
  }
} catch (err) {
  console.warn('failed to load server_config.json:', err.message);
}

function fromEnvOrSc(envKey, scPath, fallback) {
  if (process.env[envKey]) return process.env[envKey];
  let cur = serverConfig;
  for (const k of scPath) {
    if (cur && typeof cur === 'object' && k in cur) cur = cur[k];
    else return fallback;
  }
  return cur != null ? String(cur) : fallback;
}

export const config = {
  token: process.env.DISCORD_BOT_TOKEN ?? '',
  guildId: fromEnvOrSc('GUILD_ID', ['guild_id'], '0'),
  defaultVolume: parseInt(process.env.DEFAULT_VOLUME ?? '70', 10),
  maxQueueLength: parseInt(process.env.MAX_QUEUE_LENGTH ?? '100', 10),
  idleDisconnectSeconds: parseInt(process.env.IDLE_DISCONNECT_SECONDS ?? '300', 10),
  logChannels: {
    play: fromEnvOrSc('LOG_PLAY', ['bot_logs_channels', 'play'], '0'),
    errors: fromEnvOrSc('LOG_ERRORS', ['bot_logs_channels', 'errors'], '0'),
    admin: fromEnvOrSc('LOG_ADMIN', ['bot_logs_channels', 'admin'], '0'),
  },
  roleAdmin: process.env.ROLE_MUSIC_ADMIN ?? '0',
};

export const COLORS = {
  primary: 0x5865f2,
  success: 0x2ecc71,
  danger: 0xe74c3c,
  warning: 0xf39c12,
  info: 0x3498db,
  music: 0x9b59b6,
};

if (!config.token) {
  throw new Error('DISCORD_BOT_TOKEN environment variable is required');
}

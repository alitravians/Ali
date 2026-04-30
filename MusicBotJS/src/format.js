/** Helpers for formatting durations, embeds, etc. */
import { EmbedBuilder } from 'discord.js';
import { COLORS } from './config.js';

export function fmtDuration(seconds) {
  if (seconds == null || seconds < 0) return '—';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h) return `${h}:${String(mm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function progressBar(elapsed, total, width = 20) {
  if (!total || total <= 0) return '🟪'.repeat(width);
  const ratio = Math.max(0, Math.min(1, elapsed / total));
  const filled = Math.floor(ratio * width);
  return '🟪'.repeat(filled) + '⬛'.repeat(width - filled);
}

export function trackEmbed(track, opts = {}) {
  const e = new EmbedBuilder()
    .setColor(COLORS.music)
    .setTitle(opts.title ?? '🎶 يُشغَّل الآن')
    .setDescription(`**${track.title}**`)
    .addFields(
      { name: 'المدة', value: fmtDuration(track.duration), inline: true },
      { name: 'المصدر', value: track.provider ?? '-', inline: true },
    );
  if (track.requesterId) {
    e.addFields({ name: 'طلب من', value: `<@${track.requesterId}>`, inline: true });
  }
  if (track.thumbnail) e.setThumbnail(track.thumbnail);
  if (track.url) e.setURL(track.url);
  return e;
}

export function plainEmbed(color, title, description) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description ?? '');
}

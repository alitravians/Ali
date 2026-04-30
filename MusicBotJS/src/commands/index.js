import { SlashCommandBuilder } from 'discord.js';
import { getPlayer, dropPlayer, LoopMode } from '../player.js';
import { resolveQuery } from '../resolver.js';
import { COLORS } from '../config.js';
import { trackEmbed, plainEmbed, fmtDuration } from '../format.js';

async function ensureUserVoice(interaction) {
  const member = interaction.member;
  const ch = member?.voice?.channel;
  if (!ch) {
    await interaction.editReply({
      embeds: [plainEmbed(COLORS.warning, '🔇 يجب أن تكون داخل قناة صوتية أولاً.')],
    });
    return null;
  }
  return ch;
}

function commandPlay(opts) {
  return {
    data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('شغّل أغنية أو ضيفها للقائمة')
      .addStringOption((o) =>
        o.setName('query').setDescription('رابط YouTube/SoundCloud أو نص بحث').setRequired(true),
      ),
    async execute(interaction) {
      await interaction.deferReply();
      const ch = await ensureUserVoice(interaction);
      if (!ch) return;

      const query = interaction.options.getString('query', true);
      let tracks;
      try {
        tracks = await resolveQuery(query, interaction.user.id);
      } catch (err) {
        await interaction.editReply({
          embeds: [plainEmbed(COLORS.danger, '❌ تعذر إيجاد الأغنية', err.message)],
        });
        return;
      }
      if (!tracks?.length) {
        await interaction.editReply({
          embeds: [plainEmbed(COLORS.danger, '❌ لا توجد نتائج لهذا البحث')],
        });
        return;
      }

      const player = getPlayer(interaction.guild.id, opts);
      player.setTextChannel(interaction.channel);
      try {
        await player.connect(ch);
      } catch (err) {
        await interaction.editReply({
          embeds: [plainEmbed(COLORS.danger, '❌ فشل الانضمام لقناة الصوت', err.message)],
        });
        return;
      }
      const added = player.enqueue(tracks);
      const isFirst = !player.current;
      await player.start();
      if (isFirst && tracks[0]) {
        await interaction.editReply({ embeds: [trackEmbed(tracks[0])] });
      } else {
        await interaction.editReply({
          embeds: [
            plainEmbed(
              COLORS.info,
              `🎵 أُضِيفَت ${added} أغنية للقائمة`,
              `**${tracks[0].title}** — ${fmtDuration(tracks[0].duration)}`,
            ),
          ],
        });
      }
    },
  };
}

function commandSkip(opts) {
  return {
    data: new SlashCommandBuilder().setName('skip').setDescription('تخطّى الأغنية الحالية'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      if (!player.current) {
        await interaction.editReply({ embeds: [plainEmbed(COLORS.warning, 'لا توجد أغنية تشتغل حالياً')] });
        return;
      }
      const skipped = player.current;
      player.skip();
      await interaction.editReply({
        embeds: [plainEmbed(COLORS.info, '⏭️ تم التخطّي', `**${skipped.title}**`)],
      });
    },
  };
}

function commandStop(opts) {
  return {
    data: new SlashCommandBuilder().setName('stop').setDescription('أوقف التشغيل وأفرغ القائمة'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      player.disconnect();
      dropPlayer(interaction.guild.id);
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, '🛑 تم الإيقاف ومغادرة القناة')] });
    },
  };
}

function commandPause(opts) {
  return {
    data: new SlashCommandBuilder().setName('pause').setDescription('أوقف التشغيل مؤقتاً'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      if (!player.current) {
        await interaction.editReply({ embeds: [plainEmbed(COLORS.warning, 'لا توجد أغنية لإيقافها')] });
        return;
      }
      player.pause();
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, '⏸️ تم الإيقاف المؤقت')] });
    },
  };
}

function commandResume(opts) {
  return {
    data: new SlashCommandBuilder().setName('resume').setDescription('استئناف التشغيل'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      if (!player.current) {
        await interaction.editReply({ embeds: [plainEmbed(COLORS.warning, 'لا توجد أغنية للاستئناف')] });
        return;
      }
      player.resume();
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, '▶️ تم الاستئناف')] });
    },
  };
}

function commandQueue(opts) {
  return {
    data: new SlashCommandBuilder().setName('queue').setDescription('عرض قائمة الانتظار'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      const snap = player.snapshot();
      const lines = [];
      if (snap.current) {
        lines.push(`**▶️ يُشغَّل الآن:** ${snap.current.title} — ${fmtDuration(snap.current.duration)}`);
      } else {
        lines.push('*لا توجد أغنية تشتغل حالياً*');
      }
      if (snap.queue.length) {
        lines.push('');
        lines.push('**القائمة:**');
        snap.queue.slice(0, 10).forEach((t, i) => {
          lines.push(`${i + 1}. ${t.title} — ${fmtDuration(t.duration)}`);
        });
        if (snap.queue.length > 10) lines.push(`*… و ${snap.queue.length - 10} أغنية أخرى*`);
      } else {
        lines.push('');
        lines.push('*القائمة فارغة*');
      }
      await interaction.editReply({
        embeds: [plainEmbed(COLORS.music, '🎵 قائمة التشغيل', lines.join('\n'))],
      });
    },
  };
}

function commandNow(opts) {
  return {
    data: new SlashCommandBuilder().setName('now').setDescription('الأغنية الحالية'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      if (!player.current) {
        await interaction.editReply({ embeds: [plainEmbed(COLORS.warning, 'لا توجد أغنية تشتغل حالياً')] });
        return;
      }
      await interaction.editReply({ embeds: [trackEmbed(player.current)] });
    },
  };
}

function commandVolume(opts) {
  return {
    data: new SlashCommandBuilder()
      .setName('volume')
      .setDescription('ضبط مستوى الصوت (0-200)')
      .addIntegerOption((o) =>
        o.setName('value').setDescription('قيمة بين 0 و 200').setRequired(true).setMinValue(0).setMaxValue(200),
      ),
    async execute(interaction) {
      await interaction.deferReply();
      const value = interaction.options.getInteger('value', true);
      const player = getPlayer(interaction.guild.id, opts);
      player.setVolume(value);
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, `🔊 الصوت = ${value}%`)] });
    },
  };
}

function commandJoin(opts) {
  return {
    data: new SlashCommandBuilder().setName('join').setDescription('ينضم للقناة الصوتية الخاصة بك'),
    async execute(interaction) {
      await interaction.deferReply();
      const ch = await ensureUserVoice(interaction);
      if (!ch) return;
      const player = getPlayer(interaction.guild.id, opts);
      try {
        await player.connect(ch);
        await interaction.editReply({ embeds: [plainEmbed(COLORS.success, `✅ انضممت لـ ${ch.name}`)] });
      } catch (err) {
        await interaction.editReply({ embeds: [plainEmbed(COLORS.danger, '❌ فشل الانضمام', err.message)] });
      }
    },
  };
}

function commandLeave(opts) {
  return {
    data: new SlashCommandBuilder().setName('leave').setDescription('غادر القناة الصوتية'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      player.disconnect();
      dropPlayer(interaction.guild.id);
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, '👋 غادرت القناة')] });
    },
  };
}

function commandShuffle(opts) {
  return {
    data: new SlashCommandBuilder().setName('shuffle').setDescription('اخلط ترتيب القائمة'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      player.shuffle();
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, '🔀 تم خلط القائمة')] });
    },
  };
}

function commandClear(opts) {
  return {
    data: new SlashCommandBuilder().setName('clear').setDescription('فرّغ قائمة الانتظار'),
    async execute(interaction) {
      await interaction.deferReply();
      const player = getPlayer(interaction.guild.id, opts);
      const n = player.clear();
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, `🧹 حُذِفَت ${n} أغنية من القائمة`)] });
    },
  };
}

function commandLoop(opts) {
  return {
    data: new SlashCommandBuilder()
      .setName('loop')
      .setDescription('وضع التكرار')
      .addStringOption((o) =>
        o
          .setName('mode')
          .setDescription('off / track / queue')
          .setRequired(true)
          .addChoices(
            { name: 'off', value: 'none' },
            { name: 'track', value: 'track' },
            { name: 'queue', value: 'queue' },
          ),
      ),
    async execute(interaction) {
      await interaction.deferReply();
      const mode = interaction.options.getString('mode', true);
      const player = getPlayer(interaction.guild.id, opts);
      player.setLoopMode(mode);
      const labels = { none: 'متوقف', track: 'الأغنية الحالية', queue: 'القائمة' };
      await interaction.editReply({ embeds: [plainEmbed(COLORS.info, `🔁 التكرار: ${labels[mode]}`)] });
    },
  };
}

export function buildCommands(opts) {
  return [
    commandPlay(opts),
    commandSkip(opts),
    commandStop(opts),
    commandPause(opts),
    commandResume(opts),
    commandQueue(opts),
    commandNow(opts),
    commandVolume(opts),
    commandJoin(opts),
    commandLeave(opts),
    commandShuffle(opts),
    commandClear(opts),
    commandLoop(opts),
  ];
}

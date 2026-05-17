// One-shot script to register slash commands with Discord
// Run: node src/register-commands.js
// Required env: DISCORD_BOT_TOKEN, DISCORD_APP_ID, DISCORD_GUILD_ID

import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const REQUIRED = ['DISCORD_BOT_TOKEN', 'DISCORD_APP_ID', 'DISCORD_GUILD_ID'];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`missing env: ${k}`);
    process.exit(1);
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('فتح تذكرة دعم فني جديدة')
    .setDescriptionLocalizations({ ar: 'فتح تذكرة دعم فني جديدة', 'en-US': 'Open a new support ticket' })
    .addStringOption((o) =>
      o
        .setName('reason')
        .setDescription('سبب فتح التذكرة')
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('إنشاء استطلاع رأي تفاعلي')
    .addStringOption((o) =>
      o.setName('question').setDescription('السؤال').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('options').setDescription('الخيارات مفصولة بفاصلة').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('duration_minutes')
        .setDescription('مدة الاستطلاع بالدقائق (افتراضي 60)')
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('إنشاء سحب جوائز')
    .addStringOption((o) =>
      o.setName('prize').setDescription('الجائزة').setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('duration_minutes')
        .setDescription('مدة السحب بالدقائق')
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('winners')
        .setDescription('عدد الفائزين (افتراضي 1)')
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName('level')
    .setDescription('عرض مستواك ونقاط الخبرة (XP)')
    .addUserOption((o) =>
      o.setName('user').setDescription('عرض مستوى عضو آخر').setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('عرض قائمة المتصدرين'),

  new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('تسجيل تاريخ ميلادك')
    .addIntegerOption((o) =>
      o.setName('day').setDescription('اليوم 1-31').setMinValue(1).setMaxValue(31).setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName('month').setDescription('الشهر 1-12').setMinValue(1).setMaxValue(12).setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('عرض إحصائيات السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('إضافة أو إزالة دور تفاعلي')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('ربط ايموجي بدور على رسالة')
        .addStringOption((o) =>
          o.setName('message_id').setDescription('معرف الرسالة').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('emoji').setDescription('الايموجي').setRequired(true),
        )
        .addRoleOption((o) =>
          o.setName('role').setDescription('الدور').setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('إزالة ربط ايموجي بدور')
        .addStringOption((o) =>
          o.setName('message_id').setDescription('معرف الرسالة').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('emoji').setDescription('الايموجي').setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName('crosspost')
    .setDescription('إعداد نسخ الرسائل بين القنوات')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('إضافة قناة هدف لنسخ الرسائل')
        .addChannelOption((o) =>
          o.setName('source').setDescription('القناة المصدر').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('target_webhook').setDescription('Webhook URL للقناة الهدف').setRequired(true),
        ),
    ),

  new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('إدارة قائمة الكلمات الممنوعة')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((s) =>
      s
        .setName('add-word')
        .setDescription('إضافة كلمة ممنوعة')
        .addStringOption((o) =>
          o.setName('word').setDescription('الكلمة').setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('list-words')
        .setDescription('عرض الكلمات الممنوعة'),
    ),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

console.log(`registering ${commands.length} slash commands to guild ${process.env.DISCORD_GUILD_ID}...`);

const data = await rest.put(
  Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_GUILD_ID),
  { body: commands },
);

console.log(`registered ${data.length} commands successfully`);
for (const c of data) {
  console.log(`  /${c.name} - ${c.description}`);
}

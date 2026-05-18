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
  // All command descriptions are intentionally Arabic-only to match the rest
  // of the bot's UX (button labels, embed text, etc.). Discord allows
  // setDescriptionLocalizations({ ar, 'en-US' }) per command, but mixing one
  // localized command with 6 monolingual ones (as an earlier draft did) is
  // strictly worse than keeping them all consistent. Add localizations to
  // every command at once if/when an English audience is targeted.
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('فتح تذكرة دعم فني جديدة')
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

  // Staff-only command for closing an active ban appeal. Must be invoked
  // inside the appeal's private thread - workflow 14 reads channelId from
  // the interaction to look up which appeal to resolve. Restricted via
  // BanMembers because the unban action calls Discord's ban-removal API.
  new SlashCommandBuilder()
    .setName('resolve')
    .setDescription('حسم اعتراض الحظر (داخل ثريد الاعتراض فقط)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) =>
      o
        .setName('action')
        .setDescription('قرار الإدارة')
        .addChoices(
          { name: 'قبول الاعتراض ورفع الحظر (unban)', value: 'unban' },
          { name: 'رفض الاعتراض (reject)', value: 'reject' },
          { name: 'تخفيف مدة الحظر (reduce)', value: 'reduce' },
        )
        .setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName('reason')
        .setDescription('سبب القرار (يُرسل للعضو في DM)')
        .setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('minutes')
        .setDescription('للـ reduce فقط: المدة الجديدة بالدقائق من الآن')
        .setMinValue(10)
        .setMaxValue(525600)
        .setRequired(false),
    ),

  // NOTE: admin slash commands /reactionrole, /crosspost and /moderation are
  // intentionally NOT registered yet. The reactive workflows (05-reaction-roles,
  // 08-cross-posting, 03-auto-moderation) handle the *event side* (reactions
  // adding roles, messages being cross-posted, words being filtered) but the
  // admin configuration side (adding mappings, adding banned words) needs
  // its own n8n workflow that doesn't exist yet. Registering them now would
  // make the bot defer the interaction, fail to find a handler, and leave the
  // invoker staring at a perpetual "thinking..." spinner. Add the workflows
  // first, then re-introduce these SlashCommandBuilder entries here.
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

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_ROLES = [
  { name: 'owner', displayName: 'المالك', level: 100, color: '#FFD700', isSystem: true, isDefault: false },
  { name: 'admin', displayName: 'مدير', level: 90, color: '#FF4444', isSystem: true, isDefault: false },
  { name: 'head_moderator', displayName: 'رئيس المشرفين', level: 70, color: '#FF8800', isSystem: true, isDefault: false },
  { name: 'moderator', displayName: 'مشرف', level: 50, color: '#00AA00', isSystem: true, isDefault: false },
  { name: 'helper', displayName: 'مساعد مشرف', level: 30, color: '#00CCCC', isSystem: true, isDefault: false },
  { name: 'member', displayName: 'عضو', level: 10, color: '#808080', isSystem: true, isDefault: true },
  { name: 'muted', displayName: 'مكتوم', level: 5, color: '#666666', isSystem: true, isDefault: false },
  { name: 'banned', displayName: 'محظور', level: 0, color: '#333333', isSystem: true, isDefault: false },
];

const DEFAULT_ROOMS = [
  { name: 'الدردشة العامة', description: 'غرفة الدردشة الرئيسية للجميع', type: 'PUBLIC' as const, sortOrder: 1 },
  { name: 'الترحيب', description: 'رحب بالأعضاء الجدد هنا', type: 'PUBLIC' as const, sortOrder: 2 },
  { name: 'المساعدة', description: 'اطرح أسئلتك واحصل على المساعدة', type: 'PUBLIC' as const, sortOrder: 3 },
  { name: 'إعلانات الإدارة', description: 'إعلانات ومستجدات الإدارة', type: 'ANNOUNCEMENT' as const, sortOrder: 0 },
];

const DEFAULT_SETTINGS = [
  { key: 'chat_enabled', value: 'true' },
  { key: 'registration_enabled', value: 'true' },
  { key: 'site_name', value: 'ChatZone' },
  { key: 'max_message_length', value: '2000' },
  { key: 'spam_threshold', value: '5' },
  { key: 'spam_window', value: '10000' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  console.log('Creating roles...');
  const createdRoles: Record<string, string> = {};
  for (const role of DEFAULT_ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName, level: role.level, color: role.color },
      create: role,
    });
    createdRoles[role.name] = created.id;
    console.log(`  ✓ Role: ${role.displayName} (${role.name})`);
  }

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chatzone.com' },
    update: {},
    create: {
      username: 'Admin',
      email: 'admin@chatzone.com',
      password: adminPassword,
      displayName: 'المدير',
    },
  });

  // Assign owner role to admin
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: createdRoles['owner'] } },
    update: {},
    create: { userId: admin.id, roleId: createdRoles['owner'] },
  });
  console.log('  ✓ Admin user created (admin@chatzone.com / admin123)');

  // Create rooms
  console.log('Creating rooms...');
  for (const room of DEFAULT_ROOMS) {
    const created = await prisma.room.upsert({
      where: { name: room.name },
      update: { description: room.description, sortOrder: room.sortOrder },
      create: { ...room, createdById: admin.id },
    });

    // Add admin to room
    await prisma.roomMember.upsert({
      where: { userId_roomId: { userId: admin.id, roomId: created.id } },
      update: {},
      create: { userId: admin.id, roomId: created.id },
    });
    console.log(`  ✓ Room: ${room.name}`);
  }

  // Create site settings
  console.log('Creating site settings...');
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('  ✓ Settings created');

  // Create some banned words
  console.log('Creating banned words...');
  const bannedWords = ['كلمة_سيئة', 'spam', 'test_banned'];
  for (const word of bannedWords) {
    await prisma.bannedWord.upsert({
      where: { word },
      update: {},
      create: { word, createdBy: admin.id },
    });
  }
  console.log('  ✓ Banned words created');

  console.log('\n✅ Seed completed successfully!');
  console.log('─────────────────────────────────────');
  console.log('Admin Login:');
  console.log('  Email: admin@chatzone.com');
  console.log('  Password: admin123');
  console.log('Admin Panel Code: 3131');
  console.log('Moderator Panel Code: 2121');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

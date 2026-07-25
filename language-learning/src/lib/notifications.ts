import prisma from "@/lib/prisma";

interface CreateNotificationParams {
  userId: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type?: string;
  category?: string;
  icon?: string;
  link?: string;
  priority?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    title,
    titleAr,
    message,
    messageAr,
    type = "info",
    category = "general",
    icon = "bell",
    link = "",
    priority = "normal",
  } = params;

  // Check user notification settings
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  if (settings) {
    if (!settings.inAppEnabled) return null;
    const categoryMap: Record<string, boolean> = {
      educational: settings.educationalEnabled,
      certificates: settings.certificatesEnabled,
      support: settings.supportEnabled,
      account: settings.accountEnabled,
      admin: settings.adminEnabled,
      general: true,
    };
    if (categoryMap[category] === false) return null;
  }

  return prisma.notification.create({
    data: {
      title,
      titleAr,
      message,
      messageAr,
      type,
      category,
      icon,
      link,
      priority,
      userId,
    },
  });
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  const results = [];
  for (const userId of userIds) {
    const result = await createNotification({ ...params, userId });
    if (result) results.push(result);
  }
  return results;
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  bell: "🔔",
  book: "📚",
  award: "🎓",
  ticket: "🎫",
  user: "👤",
  megaphone: "📢",
  star: "⭐",
  check: "✅",
  alert: "⚠️",
  trophy: "🏆",
  key: "🔑",
  shield: "🛡️",
  rocket: "🚀",
  heart: "❤️",
};

export const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  educational: { en: "Educational", ar: "تعليمية" },
  certificates: { en: "Certificates", ar: "شهادات" },
  support: { en: "Support", ar: "دعم فني" },
  account: { en: "Account", ar: "حساب" },
  admin: { en: "Announcements", ar: "إعلانات" },
  general: { en: "General", ar: "عامة" },
};

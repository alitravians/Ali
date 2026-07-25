import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Curated lists of commonly banned words for language learning platforms
// Organized by category for proper classification
const BANNED_WORDS_DATABASE: Record<string, { words: string[]; category: string }> = {
  offensive_ar: {
    words: [
      "غبي", "أحمق", "حمار", "تافه", "خنزير", "كلب", "حيوان",
      "وسخ", "قذر", "نجس", "منحط", "سافل", "وضيع", "حقير",
      "ملعون", "لعنة", "جحيم", "شيطان", "إبليس",
      "خائن", "كذاب", "منافق", "دجال", "محتال",
    ],
    category: "offensive",
  },
  offensive_en: {
    words: [
      "stupid", "idiot", "dumb", "fool", "loser", "ugly",
      "hate", "kill", "die", "dead", "shut up",
      "noob", "trash", "garbage", "worthless", "pathetic",
    ],
    category: "offensive",
  },
  inappropriate_ar: {
    words: [
      "سب", "شتم", "لعن", "فاحشة", "عيب", "حرام",
      "مخدرات", "خمر", "سجائر", "تدخين",
      "سرقة", "غش", "تزوير", "اختراق", "هكر",
    ],
    category: "inappropriate",
  },
  inappropriate_en: {
    words: [
      "hack", "cheat", "crack", "exploit", "abuse",
      "drug", "alcohol", "smoke", "weed",
      "steal", "scam", "fraud", "fake",
    ],
    category: "inappropriate",
  },
  misleading_ar: {
    words: [
      "أدمن", "مدير", "مشرف", "رسمي", "موظف", "دعم فني",
      "نظام", "بوت", "آلي", "تلقائي",
      "فائز", "جائزة", "مجاني", "هدية", "ربح",
    ],
    category: "misleading",
  },
  misleading_en: {
    words: [
      "admin", "moderator", "staff", "official", "support",
      "system", "bot", "auto", "automated",
      "winner", "prize", "free", "gift", "reward",
    ],
    category: "misleading",
  },
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { type } = body; // "names" or "chat"

    if (!type || !["names", "chat"].includes(type)) {
      return NextResponse.json({ error: "نوع غير صالح" }, { status: 400 });
    }

    if (type === "names") {
      // For name banned words - add to BannedWord table
      // Get existing words to avoid duplicates
      const existing = await prisma.bannedWord.findMany({
        select: { word: true },
      });
      const existingSet = new Set(existing.map((w) => w.word.toLowerCase()));

      const newWords: { word: string; category: string }[] = [];

      for (const group of Object.values(BANNED_WORDS_DATABASE)) {
        for (const word of group.words) {
          const lower = word.toLowerCase();
          if (!existingSet.has(lower)) {
            newWords.push({ word: lower, category: group.category });
            existingSet.add(lower);
          }
        }
      }

      if (newWords.length === 0) {
        return NextResponse.json({
          message: "جميع الكلمات موجودة بالفعل",
          added: 0,
          words: [],
        });
      }

      // Add words one by one (createMany with skipDuplicates not supported by this adapter)
      const adminId = (auth.session.user as { id: string }).id;
      for (const w of newWords) {
        try {
          await prisma.bannedWord.create({
            data: {
              word: w.word,
              category: w.category,
              addedBy: adminId,
            },
          });
        } catch {
          // Skip duplicates silently
        }
      }

      return NextResponse.json({
        message: `تم إضافة ${newWords.length} كلمة ممنوعة بنجاح`,
        added: newWords.length,
        words: newWords.map((w) => w.word),
      });
    } else {
      // For chat banned words - return comma-separated list to merge with existing
      const allChatWords: string[] = [];
      for (const group of Object.values(BANNED_WORDS_DATABASE)) {
        allChatWords.push(...group.words);
      }

      // Get current chat banned words from settings
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "settings" },
        select: { chatBannedWords: true },
      });

      const existingChatWords = new Set(
        (settings?.chatBannedWords || "")
          .split(",")
          .map((w) => w.trim().toLowerCase())
          .filter(Boolean)
      );

      const newChatWords = allChatWords.filter(
        (w) => !existingChatWords.has(w.toLowerCase())
      );

      if (newChatWords.length === 0) {
        return NextResponse.json({
          message: "جميع الكلمات موجودة بالفعل في قائمة الدردشة",
          added: 0,
          words: [],
          mergedList: settings?.chatBannedWords || "",
        });
      }

      // Merge with existing
      const allWords = [
        ...(settings?.chatBannedWords ? [settings.chatBannedWords] : []),
        ...newChatWords,
      ].join(", ");

      return NextResponse.json({
        message: `تم استخراج ${newChatWords.length} كلمة جديدة`,
        added: newChatWords.length,
        words: newChatWords,
        mergedList: allWords,
      });
    }
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

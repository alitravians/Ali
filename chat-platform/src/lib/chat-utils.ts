import prisma from './prisma';

const defaultBannedWords = ['كلمة_ممنوعة'];

export async function getBannedWords(): Promise<string[]> {
  const words = await prisma.bannedWord.findMany();
  return words.map((w) => w.word);
}

export function filterMessage(content: string, bannedWords: string[]): { filtered: string; containsBanned: boolean } {
  let filtered = content;
  let containsBanned = false;

  for (const word of bannedWords) {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filtered)) {
      containsBanned = true;
      filtered = filtered.replace(regex, '***');
    }
  }

  return { filtered, containsBanned };
}

// Spam protection
const messageTimestamps: Map<string, number[]> = new Map();
const MAX_MESSAGES_PER_INTERVAL = 5;
const INTERVAL_MS = 10000; // 10 seconds

export function checkSpam(userId: string): boolean {
  const now = Date.now();
  const timestamps = messageTimestamps.get(userId) || [];
  
  // Remove old timestamps
  const recent = timestamps.filter((t) => now - t < INTERVAL_MS);
  
  if (recent.length >= MAX_MESSAGES_PER_INTERVAL) {
    return true; // Is spam
  }
  
  recent.push(now);
  messageTimestamps.set(userId, recent);
  return false; // Not spam
}

export function processBoldMessage(content: string, hasPermission: boolean): { text: string; isBold: boolean } {
  if (content.startsWith('$') && hasPermission) {
    return { text: content.substring(1).trim(), isBold: true };
  }
  return { text: content, isBold: false };
}

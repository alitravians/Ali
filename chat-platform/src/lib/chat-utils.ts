import prisma from './prisma';

const defaultBannedWords = ['كلمة_ممنوعة'];

let bannedWordsCache: string[] | null = null;
let bannedWordsCacheTime = 0;
const BANNED_WORDS_CACHE_TTL = 60_000; // 1 minute

/** Invalidate the banned words cache so the next call fetches fresh data from DB */
export function invalidateBannedWordsCache(): void {
  bannedWordsCache = null;
  bannedWordsCacheTime = 0;
}

export async function getBannedWords(): Promise<string[]> {
  const now = Date.now();
  if (bannedWordsCache && now - bannedWordsCacheTime < BANNED_WORDS_CACHE_TTL) {
    return bannedWordsCache;
  }
  const words = await prisma.bannedWord.findMany();
  bannedWordsCache = words.map((w) => w.word);
  bannedWordsCacheTime = now;
  return bannedWordsCache;
}

export function filterMessage(content: string, bannedWords: string[]): { filtered: string; containsBanned: boolean } {
  let filtered = content;
  let containsBanned = false;

  for (const word of bannedWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const newFiltered = filtered.replace(regex, '***');
    if (newFiltered !== filtered) {
      containsBanned = true;
      filtered = newFiltered;
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

// Periodically clean up stale spam tracking entries
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of messageTimestamps) {
    const recent = timestamps.filter((t) => now - t < INTERVAL_MS);
    if (recent.length === 0) {
      messageTimestamps.delete(userId);
    }
  }
}, 60_000); // Clean up every minute

export function processBoldMessage(content: string, hasPermission: boolean): { text: string; isBold: boolean } {
  if (content.startsWith('$') && hasPermission) {
    return { text: content.substring(1).trim(), isBold: true };
  }
  return { text: content, isBold: false };
}

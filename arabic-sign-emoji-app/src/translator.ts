import { wordDictionary } from "./data/dictionary";
import { arabicAlphabet } from "./data/alphabet";

export interface TranslatedToken {
  word: string;
  emoji: string;
  fingerSpelled: boolean;
}

export interface TranslationResult {
  input: string;
  tokens: TranslatedToken[];
  emojiString: string;
  timestamp: number;
}

const punctuationRegex = /[.,!?،؛:؟"'()\[\]{}«»\-]/g;

export function normalizeArabic(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function splitWords(text: string): string[] {
  return normalizeArabic(text.replace(punctuationRegex, " "))
    .split(" ")
    .filter(Boolean);
}

function lookupPhrase(words: string[], start: number): { emoji: string; consumed: number } | null {
  for (let len = Math.min(4, words.length - start); len >= 2; len--) {
    const phrase = words.slice(start, start + len).join(" ");
    if (wordDictionary[phrase]) {
      return { emoji: wordDictionary[phrase], consumed: len };
    }
  }
  return null;
}

function fingerSpell(word: string): string {
  let out = "";
  for (const ch of word) {
    out += arabicAlphabet[ch] || "";
  }
  return out;
}

export function translate(text: string): TranslationResult {
  const words = splitWords(text);
  const tokens: TranslatedToken[] = [];
  let i = 0;
  while (i < words.length) {
    const phrase = lookupPhrase(words, i);
    if (phrase) {
      tokens.push({
        word: words.slice(i, i + phrase.consumed).join(" "),
        emoji: phrase.emoji,
        fingerSpelled: false,
      });
      i += phrase.consumed;
      continue;
    }
    const w = words[i];
    if (wordDictionary[w]) {
      tokens.push({ word: w, emoji: wordDictionary[w], fingerSpelled: false });
    } else {
      const spelled = fingerSpell(w);
      tokens.push({ word: w, emoji: spelled || "❓", fingerSpelled: true });
    }
    i++;
  }
  return {
    input: text,
    tokens,
    emojiString: tokens.map((t) => t.emoji).join(" "),
    timestamp: Date.now(),
  };
}

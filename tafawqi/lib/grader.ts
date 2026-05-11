// محرّك التصحيح لمختلف أنواع الأسئلة

export function normalizeArabic(s: string): string {
  return s
    .trim()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F]/g, "") // diacritics
    .replace(/\s+/g, " ")
    .replace(/—/g, "-")
    .replace(/[٠]/g, "0")
    .replace(/[١]/g, "1")
    .replace(/[٢]/g, "2")
    .replace(/[٣]/g, "3")
    .replace(/[٤]/g, "4")
    .replace(/[٥]/g, "5")
    .replace(/[٦]/g, "6")
    .replace(/[٧]/g, "7")
    .replace(/[٨]/g, "8")
    .replace(/[٩]/g, "9")
    .toLowerCase();
}

export function gradeAnswer(
  type: string,
  payload: any,
  answer: any
): boolean {
  try {
    if (type === "mcq") {
      return Number(answer) === Number(payload.answer);
    }
    if (type === "tf") {
      return Boolean(answer) === Boolean(payload.answer);
    }
    if (type === "fill") {
      const a = normalizeArabic(String(answer ?? ""));
      if (!a) return false;
      const accepted: string[] = payload.answers || [];
      return accepted.some((acc) => normalizeArabic(acc) === a);
    }
    if (type === "match") {
      // answer is array of indices matching original left order
      const pairs: number[] = payload.pairs || [];
      const ans = Array.isArray(answer) ? answer : [];
      if (ans.length !== pairs.length) return false;
      return ans.every((v: number, i: number) => Number(v) === Number(pairs[i]));
    }
    if (type === "order") {
      const correct: number[] = payload.correct || [];
      const ans = Array.isArray(answer) ? answer : [];
      if (ans.length !== correct.length) return false;
      return ans.every((v: number, i: number) => Number(v) === Number(correct[i]));
    }
    return false;
  } catch {
    return false;
  }
}

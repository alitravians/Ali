interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithSpeech;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceInputSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedArabicVoice: SpeechSynthesisVoice | null = null;

function pickArabicVoice(): SpeechSynthesisVoice | null {
  if (cachedArabicVoice) return cachedArabicVoice;
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const arabic = voices.find((v) => v.lang.toLowerCase().startsWith("ar"));
  if (arabic) cachedArabicVoice = arabic;
  return arabic ?? null;
}

if (typeof window !== "undefined" && isSpeechSynthesisSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedArabicVoice = null;
    pickArabicVoice();
  };
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

export function speak(text: string, opts: SpeakOptions = {}): boolean {
  if (!text.trim()) return false;
  if (!isSpeechSynthesisSupported()) {
    opts.onError?.("النطق الصوتي غير متاح على هذا الجهاز");
    return false;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? "ar-SA";
  u.rate = opts.rate ?? 0.9;
  u.pitch = opts.pitch ?? 1;
  u.volume = opts.volume ?? 1;
  const v = pickArabicVoice();
  if (v) u.voice = v;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onError?.("حدث خطأ أثناء النطق. حاول مرة أخرى.");
  window.speechSynthesis.speak(u);
  return true;
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

export function describeRecognitionError(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "الرجاء السماح بالوصول للميكروفون من إعدادات المتصفح";
    case "no-speech":
      return "لم يتم اكتشاف أي صوت. حاول مرة أخرى.";
    case "network":
      return "خطأ في الاتصال. تأكد من اتصالك بالإنترنت.";
    case "aborted":
      return "";
    default:
      return "حدث خطأ أثناء التسجيل الصوتي.";
  }
}

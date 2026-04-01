// Arabic Text-to-Speech utility
// Uses native Capacitor TTS plugin on Android (bypasses WebView limitations)
// Falls back to Web Speech API in browser for development

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

let nativeTTSAvailable: boolean | null = null;
let nativeTTSCheckInProgress = false;
let currentSpeaking = false;

// Check if we're running in a native Capacitor environment
function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test if native TTS is available (with retry logic for engine initialization)
async function checkNativeTTS(): Promise<boolean> {
  // If already confirmed available, return immediately
  if (nativeTTSAvailable === true) return true;

  if (!isNative()) {
    nativeTTSAvailable = false;
    return false;
  }

  // Prevent multiple concurrent checks
  if (nativeTTSCheckInProgress) {
    // Wait for ongoing check to complete
    await delay(500);
    return nativeTTSAvailable === true;
  }

  nativeTTSCheckInProgress = true;

  // Retry up to 5 times with increasing delays
  // Android TTS engine takes time to initialize after app launch
  const retryDelays = [0, 500, 1000, 2000, 3000];

  for (let i = 0; i < retryDelays.length; i++) {
    if (retryDelays[i] > 0) {
      console.log(`[TTS] Waiting ${retryDelays[i]}ms before retry ${i + 1}...`);
      await delay(retryDelays[i]);
    }

    try {
      const result = await TextToSpeech.getSupportedLanguages();
      console.log('[TTS] Native TTS available! Languages:', JSON.stringify(result));
      nativeTTSAvailable = true;
      nativeTTSCheckInProgress = false;
      return true;
    } catch (e) {
      console.warn(`[TTS] Check attempt ${i + 1}/${retryDelays.length} failed:`, e);
    }
  }

  console.warn('[TTS] Native TTS not available after retries, falling back to Web Speech API');
  nativeTTSAvailable = false;
  nativeTTSCheckInProgress = false;
  return false;
}

// Initialize check early (but don't block on it)
if (typeof window !== 'undefined') {
  checkNativeTTS();
}

// ============ Native TTS (Capacitor plugin) ============

// Try multiple Arabic language codes in case some aren't available on the device
const ARABIC_LANG_CODES = ['ar-SA', 'ar', 'ar-EG', 'ar-AE'];

async function findSupportedArabicLang(): Promise<string> {
  for (const lang of ARABIC_LANG_CODES) {
    try {
      const result = await TextToSpeech.isLanguageSupported({ lang });
      if (result.supported) {
        console.log(`[TTS] Arabic language supported: ${lang}`);
        return lang;
      }
    } catch (e) {
      console.warn(`[TTS] Error checking language ${lang}:`, e);
    }
  }
  // Default to ar-SA even if check failed (let the engine try)
  console.warn('[TTS] No Arabic language confirmed supported, trying ar-SA anyway');
  return 'ar-SA';
}

let cachedArabicLang: string | null = null;

async function speakNative(text: string): Promise<void> {
  currentSpeaking = true;
  try {
    // Find a supported Arabic language code (cached after first success)
    if (!cachedArabicLang) {
      cachedArabicLang = await findSupportedArabicLang();
    }

    console.log(`[TTS] Speaking with lang=${cachedArabicLang}: "${text.substring(0, 50)}..."`);

    await TextToSpeech.speak({
      text,
      lang: cachedArabicLang,
      rate: 0.85,
      pitch: 1.1,
      volume: 1.0,
      category: 'ambient',
    });
    console.log('[TTS] Speech completed successfully');
  } catch (e) {
    console.error('[TTS] Native speak error:', e);

    // If language was cached and failed, reset cache and retry once
    if (cachedArabicLang) {
      const failedLang = cachedArabicLang;
      cachedArabicLang = null;
      console.log(`[TTS] Retrying with fresh language detection (failed lang: ${failedLang})`);
      try {
        cachedArabicLang = await findSupportedArabicLang();
        if (cachedArabicLang !== failedLang) {
          await TextToSpeech.speak({
            text,
            lang: cachedArabicLang,
            rate: 0.85,
            pitch: 1.1,
            volume: 1.0,
            category: 'ambient',
          });
          console.log('[TTS] Retry speech completed successfully');
          return;
        }
      } catch (retryError) {
        console.error('[TTS] Retry also failed:', retryError);
      }
    }
  } finally {
    currentSpeaking = false;
  }
}

async function stopNative(): Promise<void> {
  try {
    await TextToSpeech.stop();
    currentSpeaking = false;
  } catch {
    currentSpeaking = false;
  }
}

// ============ Web Speech API fallback (for browser dev) ============

let voicesLoaded = false;
let cachedArabicVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 2000);
  });
}

async function getArabicVoice(): Promise<SpeechSynthesisVoice | null> {
  if (voicesLoaded && cachedArabicVoice !== undefined) {
    return cachedArabicVoice;
  }

  const voices = await loadVoices();
  voicesLoaded = true;

  cachedArabicVoice = voices.find(v => v.lang === 'ar-SA') ||
    voices.find(v => v.lang.startsWith('ar')) ||
    null;

  return cachedArabicVoice;
}

function speakWeb(text: string): void {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const doSpeak = (voice: SpeechSynthesisVoice | null) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    if (voice) {
      utterance.voice = voice;
    }

    currentSpeaking = true;

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);

      const resumeInterval = setInterval(() => {
        if (!('speechSynthesis' in window) || !window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
          currentSpeaking = false;
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10000);

      utterance.onend = () => {
        clearInterval(resumeInterval);
        currentSpeaking = false;
      };
      utterance.onerror = () => {
        clearInterval(resumeInterval);
        currentSpeaking = false;
      };
    }, 100);
  };

  if (voicesLoaded) {
    doSpeak(cachedArabicVoice);
  } else {
    getArabicVoice().then(doSpeak);
  }
}

function stopWeb(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentSpeaking = false;
}

// Initialize web voices early (for browser dev)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  loadVoices().then(() => { voicesLoaded = true; });
}

// ============ Public API ============

export function speakArabic(text: string): void {
  stopSpeaking();

  if (isNative()) {
    // On native platforms, always try native TTS
    // Re-check availability each time in case engine initialized late
    if (nativeTTSAvailable === true) {
      speakNative(text);
    } else {
      // Reset failed state so we retry
      if (nativeTTSAvailable === false) {
        nativeTTSAvailable = null;
      }
      checkNativeTTS().then((available) => {
        if (available) {
          speakNative(text);
        } else {
          // Last resort: try native anyway, engine might work even if check failed
          console.log('[TTS] Trying native TTS as last resort...');
          speakNative(text);
        }
      });
    }
  } else {
    // In browser, use Web Speech API
    speakWeb(text);
  }
}

export function stopSpeaking(): void {
  if (nativeTTSAvailable) {
    stopNative();
  } else {
    stopWeb();
  }
}

export function isSpeaking(): boolean {
  return currentSpeaking;
}

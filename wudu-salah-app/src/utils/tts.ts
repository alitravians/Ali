// Arabic Text-to-Speech utility
// Strategy: Try native Capacitor TTS first, then Google Translate audio fallback
// The audio fallback works in any WebView by playing MP3 from Google Translate

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

let currentSpeaking = false;
let currentAudio: HTMLAudioElement | null = null;
let audioQueue: HTMLAudioElement[] = [];
let nativeTTSWorks: boolean | null = null; // null = untested, true/false = tested

// ============ Helpers ============

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ Google Translate Audio TTS (reliable fallback) ============
// Works in any WebView - plays audio from Google Translate via HTML5 Audio

function splitTextIntoChunks(text: string, maxLen = 200): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    let splitIdx = -1;
    for (let i = maxLen; i >= maxLen / 2; i--) {
      const ch = remaining[i];
      if (ch === '.' || ch === '،' || ch === '؟' || ch === '!' || ch === '\n') {
        splitIdx = i + 1;
        break;
      }
    }

    if (splitIdx === -1) {
      for (let i = maxLen; i >= maxLen / 2; i--) {
        if (remaining[i] === ' ') {
          splitIdx = i + 1;
          break;
        }
      }
    }

    if (splitIdx === -1) {
      splitIdx = maxLen;
    }

    chunks.push(remaining.substring(0, splitIdx).trim());
    remaining = remaining.substring(splitIdx).trim();
  }

  return chunks;
}

function createAudioUrl(text: string): string {
  const encoded = encodeURIComponent(text);
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=ar&client=tw-ob`;
}

async function speakWithAudio(text: string): Promise<void> {
  stopAudio();
  currentSpeaking = true;

  const chunks = splitTextIntoChunks(text);
  console.log(`[TTS-Audio] Playing ${chunks.length} chunk(s)`);

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (!currentSpeaking) break;

      const url = createAudioUrl(chunks[i]);
      console.log(`[TTS-Audio] Playing chunk ${i + 1}/${chunks.length}: "${chunks[i].substring(0, 30)}..."`);

      await playAudioChunk(url);
    }
  } catch (e) {
    console.error('[TTS-Audio] Playback error:', e);
  } finally {
    currentSpeaking = false;
    currentAudio = null;
  }
}

function playAudioChunk(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    audioQueue.push(audio);

    const timeout = setTimeout(() => {
      audio.pause();
      audioQueue = audioQueue.filter(a => a !== audio);
      resolve();
    }, 30000);

    audio.onended = () => {
      clearTimeout(timeout);
      audioQueue = audioQueue.filter(a => a !== audio);
      resolve();
    };

    audio.onerror = (e) => {
      console.error('[TTS-Audio] Audio error:', e);
      clearTimeout(timeout);
      audioQueue = audioQueue.filter(a => a !== audio);
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch((e) => {
      console.error('[TTS-Audio] Play() failed:', e);
      clearTimeout(timeout);
      audioQueue = audioQueue.filter(a => a !== audio);
      reject(e);
    });
  });
}

function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  for (const audio of audioQueue) {
    audio.pause();
  }
  audioQueue = [];
}

// ============ Native TTS (Capacitor plugin) ============

const ARABIC_LANG_CODES = ['ar-SA', 'ar', 'ar-EG', 'ar-AE'];
let cachedArabicLang: string | null = null;

async function findSupportedArabicLang(): Promise<string | null> {
  for (const lang of ARABIC_LANG_CODES) {
    try {
      const result = await TextToSpeech.isLanguageSupported({ lang });
      if (result.supported) {
        console.log(`[TTS-Native] Arabic language supported: ${lang}`);
        return lang;
      }
    } catch (e) {
      console.warn(`[TTS-Native] Error checking language ${lang}:`, e);
    }
  }
  return null;
}

async function tryNativeTTS(text: string): Promise<boolean> {
  if (nativeTTSWorks === false) return false;

  try {
    // Wait for engine to initialize
    let available = false;
    const retryDelays = [0, 300, 600, 1000, 2000];

    for (let i = 0; i < retryDelays.length; i++) {
      if (retryDelays[i] > 0) await delay(retryDelays[i]);
      try {
        await TextToSpeech.getSupportedLanguages();
        available = true;
        break;
      } catch {
        console.log(`[TTS-Native] Init attempt ${i + 1} failed, retrying...`);
      }
    }

    if (!available) {
      console.warn('[TTS-Native] Engine not available after retries');
      nativeTTSWorks = false;
      return false;
    }

    if (!cachedArabicLang) {
      cachedArabicLang = await findSupportedArabicLang();
    }

    if (!cachedArabicLang) {
      console.warn('[TTS-Native] No Arabic language supported on this device');
      nativeTTSWorks = false;
      return false;
    }

    console.log(`[TTS-Native] Speaking: "${text.substring(0, 50)}..." with lang=${cachedArabicLang}`);

    await TextToSpeech.speak({
      text,
      lang: cachedArabicLang,
      rate: 0.85,
      pitch: 1.1,
      volume: 1.0,
      category: 'ambient',
    });

    console.log('[TTS-Native] Speech completed successfully!');
    nativeTTSWorks = true;
    return true;
  } catch (e) {
    console.error('[TTS-Native] Failed:', e);
    cachedArabicLang = null;
    nativeTTSWorks = false;
    return false;
  }
}

// ============ Web Speech API (browser dev only) ============

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

    if (voice) utterance.voice = voice;
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

      utterance.onend = () => { clearInterval(resumeInterval); currentSpeaking = false; };
      utterance.onerror = () => { clearInterval(resumeInterval); currentSpeaking = false; };
    }, 100);
  };

  if (voicesLoaded) {
    doSpeak(cachedArabicVoice);
  } else {
    getArabicVoice().then(doSpeak);
  }
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
    // On Android: try native TTS first, fallback to Google Translate audio
    currentSpeaking = true;

    if (nativeTTSWorks === false) {
      // Native already confirmed broken, go straight to audio fallback
      console.log('[TTS] Using audio fallback (native known broken)');
      speakWithAudio(text);
    } else {
      // Try native first
      tryNativeTTS(text).then((success) => {
        if (!success && currentSpeaking) {
          console.log('[TTS] Native failed, switching to audio fallback');
          speakWithAudio(text);
        }
      });
    }
  } else {
    // In browser: use Web Speech API, fallback to audio
    if ('speechSynthesis' in window) {
      speakWeb(text);
    } else {
      speakWithAudio(text);
    }
  }
}

export function stopSpeaking(): void {
  currentSpeaking = false;
  stopAudio();
  if (isNative()) {
    TextToSpeech.stop().catch(() => {});
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return currentSpeaking;
}

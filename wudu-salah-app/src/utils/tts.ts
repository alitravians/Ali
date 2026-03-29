// Arabic Text-to-Speech utility
// Uses native Capacitor TTS plugin on Android (bypasses WebView limitations)
// Falls back to Web Speech API in browser for development

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

let nativeTTSAvailable: boolean | null = null;
let currentSpeaking = false;

// Check if we're running in a native Capacitor environment
function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

// Test if native TTS is available
async function checkNativeTTS(): Promise<boolean> {
  if (nativeTTSAvailable !== null) return nativeTTSAvailable;

  if (!isNative()) {
    nativeTTSAvailable = false;
    return false;
  }

  try {
    // On native platforms, the plugin should always be available
    // Just verify it can be called without throwing
    await TextToSpeech.getSupportedLanguages();
    nativeTTSAvailable = true;
    return true;
  } catch (e) {
    console.warn('[TTS] Native TTS not available, falling back to Web Speech API:', e);
    nativeTTSAvailable = false;
    return false;
  }
}

// Initialize check early
if (typeof window !== 'undefined') {
  checkNativeTTS();
}

// ============ Native TTS (Capacitor plugin) ============

async function speakNative(text: string): Promise<void> {
  currentSpeaking = true;
  try {
    await TextToSpeech.speak({
      text,
      lang: 'ar-SA',
      rate: 0.85,
      pitch: 1.1,
      volume: 1.0,
      category: 'ambient',
    });
  } catch (e) {
    console.warn('[TTS] Native speak error:', e);
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

  if (nativeTTSAvailable) {
    speakNative(text);
  } else {
    checkNativeTTS().then((available) => {
      if (available) {
        speakNative(text);
      } else {
        speakWeb(text);
      }
    });
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

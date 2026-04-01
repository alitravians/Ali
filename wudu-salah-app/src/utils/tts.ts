// Arabic Text-to-Speech utility
// Strategy: On Android, use Google Translate audio with Web Audio API
// Web Audio API (AudioContext) bypasses autoplay restrictions when created in user gesture
// fetch() goes through Capacitor native HTTP which bypasses CORS

import { Capacitor } from '@capacitor/core';

let currentSpeaking = false;
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let pendingChunks: string[] = [];

// ============ Helpers ============

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

// Get or create AudioContext - MUST be called during user gesture to unlock audio
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    console.log('[TTS] AudioContext created, state:', audioContext.state);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
    console.log('[TTS] AudioContext resumed');
  }
  return audioContext;
}

// ============ Google Translate Audio TTS ============

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

async function playChunkWithWebAudio(ctx: AudioContext, url: string): Promise<void> {
  console.log('[TTS-Audio] Fetching audio from:', url.substring(0, 80) + '...');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log('[TTS-Audio] Fetched', arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength === 0) {
    throw new Error('Empty audio response');
  }

  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  console.log('[TTS-Audio] Decoded audio:', audioBuffer.duration.toFixed(2), 'seconds');

  return new Promise<void>((resolve, reject) => {
    if (!currentSpeaking) {
      resolve();
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    currentSource = source;

    source.onended = () => {
      currentSource = null;
      resolve();
    };

    try {
      source.start(0);
      console.log('[TTS-Audio] Playback started');
    } catch (e) {
      currentSource = null;
      reject(e);
    }

    // Safety timeout
    setTimeout(() => {
      if (currentSource === source) {
        console.warn('[TTS-Audio] Chunk timeout');
        try { source.stop(); } catch (_e) { /* ignore */ }
        currentSource = null;
        resolve();
      }
    }, 30000);
  });
}

async function speakWithAudio(text: string, ctx: AudioContext): Promise<void> {
  currentSpeaking = true;
  pendingChunks = splitTextIntoChunks(text);
  console.log(`[TTS-Audio] Playing ${pendingChunks.length} chunk(s)`);

  try {
    for (let i = 0; i < pendingChunks.length; i++) {
      if (!currentSpeaking) {
        console.log('[TTS-Audio] Stopped by user');
        break;
      }

      const chunk = pendingChunks[i];
      const url = createAudioUrl(chunk);
      console.log(`[TTS-Audio] Chunk ${i + 1}/${pendingChunks.length}: "${chunk.substring(0, 40)}..."`);

      try {
        await playChunkWithWebAudio(ctx, url);
      } catch (e) {
        console.error(`[TTS-Audio] Chunk ${i + 1} failed:`, e);
        // Continue to next chunk
      }
    }
  } catch (e) {
    console.error('[TTS-Audio] Playback error:', e);
  } finally {
    currentSpeaking = false;
    currentSource = null;
    pendingChunks = [];
    console.log('[TTS-Audio] Playback complete');
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

  // IMPORTANT: Create/resume AudioContext NOW (in user gesture context)
  // This unlocks audio playback on Android WebView
  const ctx = getAudioContext();

  if (isNative()) {
    // On Android: use Google Translate audio via Web Audio API
    console.log('[TTS] Android - using Google Translate audio via Web Audio API');
    speakWithAudio(text, ctx);
  } else {
    // In browser: try Web Speech API first, fallback to Google Translate audio
    if ('speechSynthesis' in window) {
      speakWeb(text);
    } else {
      speakWithAudio(text, ctx);
    }
  }
}

export function stopSpeaking(): void {
  currentSpeaking = false;
  pendingChunks = [];

  if (currentSource) {
    try { currentSource.stop(); } catch (_e) { /* ignore */ }
    currentSource = null;
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return currentSpeaking;
}

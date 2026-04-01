// Arabic Text-to-Speech utility
// Strategy: On Android, use Google Translate audio directly (most reliable)
// In browser, use Web Speech API with Google Translate audio fallback
// The audio approach uses fetch + blob URL to bypass CORS in WebView

import { Capacitor } from '@capacitor/core';

let currentSpeaking = false;
let currentAudio: HTMLAudioElement | null = null;
let audioQueue: HTMLAudioElement[] = [];

// ============ Helpers ============

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

// ============ Google Translate Audio TTS (primary on Android) ============
// Uses fetch() to download MP3 (Capacitor native HTTP bypasses CORS)
// Then plays via blob URL (local, no CORS issues)

function splitTextIntoChunks(text: string, maxLen = 200): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    let splitIdx = -1;
    // Try to split at sentence boundary
    for (let i = maxLen; i >= maxLen / 2; i--) {
      const ch = remaining[i];
      if (ch === '.' || ch === '،' || ch === '؟' || ch === '!' || ch === '\n') {
        splitIdx = i + 1;
        break;
      }
    }

    // Try to split at word boundary
    if (splitIdx === -1) {
      for (let i = maxLen; i >= maxLen / 2; i--) {
        if (remaining[i] === ' ') {
          splitIdx = i + 1;
          break;
        }
      }
    }

    // Hard split
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

async function fetchAudioBlob(url: string): Promise<string> {
  // Use fetch() which goes through Capacitor's native HTTP (bypasses CORS)
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const blob = await response.blob();
  // Create a local blob URL that the Audio element can play without CORS
  return URL.createObjectURL(blob);
}

async function speakWithAudio(text: string): Promise<void> {
  stopAudio();
  currentSpeaking = true;

  const chunks = splitTextIntoChunks(text);
  console.log(`[TTS-Audio] Playing ${chunks.length} chunk(s)`);

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (!currentSpeaking) break;

      const googleUrl = createAudioUrl(chunks[i]);
      console.log(`[TTS-Audio] Fetching chunk ${i + 1}/${chunks.length}: "${chunks[i].substring(0, 30)}..."`);

      try {
        // Fetch the audio as blob (native HTTP, no CORS)
        const blobUrl = await fetchAudioBlob(googleUrl);
        console.log(`[TTS-Audio] Playing chunk ${i + 1} from blob URL`);
        await playAudioChunk(blobUrl);
        // Clean up blob URL after playback
        URL.revokeObjectURL(blobUrl);
      } catch (fetchErr) {
        console.error(`[TTS-Audio] Fetch failed for chunk ${i + 1}:`, fetchErr);
        // Try direct URL as last resort
        console.log(`[TTS-Audio] Trying direct URL for chunk ${i + 1}`);
        try {
          await playAudioChunk(googleUrl);
        } catch (directErr) {
          console.error(`[TTS-Audio] Direct URL also failed:`, directErr);
          // Continue to next chunk instead of stopping entirely
        }
      }
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

    // Safety timeout - 30 seconds max per chunk
    const timeout = setTimeout(() => {
      console.warn('[TTS-Audio] Chunk timeout, moving on');
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
      console.error('[TTS-Audio] Audio element error:', e);
      clearTimeout(timeout);
      audioQueue = audioQueue.filter(a => a !== audio);
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch((e) => {
      console.error('[TTS-Audio] play() rejected:', e);
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
    // On Android: use Google Translate audio directly (most reliable)
    // Native TTS is unreliable - Arabic voice data often not installed
    console.log('[TTS] Android detected - using Google Translate audio');
    speakWithAudio(text);
  } else {
    // In browser: try Web Speech API first, fallback to audio
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
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return currentSpeaking;
}

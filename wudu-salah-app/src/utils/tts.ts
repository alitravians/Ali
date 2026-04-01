// Arabic Text-to-Speech utility - Debug version
// Uses translate.googleapis.com (works on mobile, unlike translate.google.com which returns 404)
// Shows visible debug messages so user can report exactly what fails

import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

let currentSpeaking = false;
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

// ============ Debug Overlay ============

let debugContainer: HTMLDivElement | null = null;

function showDebug(msg: string): void {
  console.log('[TTS]', msg);
  if (!debugContainer) {
    debugContainer = document.createElement('div');
    debugContainer.id = 'tts-debug';
    debugContainer.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:rgba(0,0,0,0.85);color:#0f0;padding:8px 12px;' +
      'font-size:11px;font-family:monospace;direction:ltr;text-align:left;' +
      'max-height:150px;overflow-y:auto;pointer-events:none;';
    document.body.appendChild(debugContainer);
  }
  const line = document.createElement('div');
  const now = new Date();
  const ts = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
  line.textContent = ts + ' ' + msg;
  debugContainer.appendChild(line);
  debugContainer.scrollTop = debugContainer.scrollHeight;
  setTimeout(function() {
    if (debugContainer && debugContainer.children.length <= 1) {
      debugContainer.remove();
      debugContainer = null;
    } else if (debugContainer && line.parentNode === debugContainer) {
      debugContainer.removeChild(line);
    }
  }, 15000);
}

// ============ Helpers ============

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    showDebug('AudioContext created, state: ' + audioContext.state);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
    showDebug('AudioContext resumed');
  }
  return audioContext;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============ Audio Fetching ============

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
  // Use our TTS proxy to bypass Google rate limiting (302/429 errors)
  // Google blocks direct requests from mobile WebView and cloud IPs
  return 'https://tts-proxy-jabcxjlh.fly.dev/tts?tl=ar&q=' + encoded;
}

// Method 1: CapacitorHttp (native HTTP, no CORS)
async function fetchWithCapacitorHttp(url: string): Promise<ArrayBuffer> {
  showDebug('Fetch: CapacitorHttp...');
  const response = await CapacitorHttp.get({ url: url, responseType: 'blob' });
  showDebug('CapHttp status=' + response.status + ' type=' + typeof response.data);
  if (response.status !== 200) throw new Error('HTTP ' + response.status);
  if (typeof response.data === 'string') {
    showDebug('Got base64: ' + response.data.length + ' chars');
    return base64ToArrayBuffer(response.data);
  }
  if (response.data instanceof ArrayBuffer) return response.data;
  throw new Error('Bad response type: ' + typeof response.data);
}

// Method 2: fetch()
async function fetchWithFetch(url: string): Promise<ArrayBuffer> {
  showDebug('Fetch: fetch()...');
  const r = await fetch(url);
  showDebug('fetch status=' + r.status);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = await r.arrayBuffer();
  showDebug('fetch: ' + buf.byteLength + ' bytes');
  return buf;
}

// Method 3: XHR
async function fetchWithXHR(url: string): Promise<ArrayBuffer> {
  showDebug('Fetch: XHR...');
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      showDebug('XHR status=' + xhr.status + ' size=' + (xhr.response ? xhr.response.byteLength : 0));
      if (xhr.status === 200 && xhr.response) resolve(xhr.response as ArrayBuffer);
      else reject(new Error('XHR ' + xhr.status));
    };
    xhr.onerror = function() { showDebug('XHR network error'); reject(new Error('XHR error')); };
    xhr.send();
  });
}

async function fetchAudio(url: string): Promise<ArrayBuffer> {
  if (isNative()) {
    try { return await fetchWithCapacitorHttp(url); }
    catch (e) { showDebug('CapHttp fail: ' + (e instanceof Error ? e.message : String(e))); }
  }
  try { return await fetchWithFetch(url); }
  catch (e) { showDebug('fetch fail: ' + (e instanceof Error ? e.message : String(e))); }
  try { return await fetchWithXHR(url); }
  catch (e) { showDebug('XHR fail: ' + (e instanceof Error ? e.message : String(e))); }
  throw new Error('All fetch methods failed');
}

// ============ Audio Playback ============

async function playWebAudio(ctx: AudioContext, data: ArrayBuffer): Promise<void> {
  showDebug('Play: WebAudio...');
  const buf = await ctx.decodeAudioData(data.slice(0));
  showDebug('Decoded: ' + buf.duration.toFixed(1) + 's');
  return new Promise<void>(function(resolve) {
    if (!currentSpeaking) { resolve(); return; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    currentSource = src;
    src.onended = function() { currentSource = null; resolve(); };
    src.start(0);
    showDebug('WebAudio playing!');
    setTimeout(function() {
      if (currentSource === src) {
        try { src.stop(); } catch (_e) { /* ignore */ }
        currentSource = null; resolve();
      }
    }, 30000);
  });
}

async function playHtmlAudio(data: ArrayBuffer): Promise<void> {
  showDebug('Play: HTML5+blob...');
  const blob = new Blob([data], { type: 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);
  return new Promise<void>(function(resolve, reject) {
    const a = new Audio(blobUrl);
    a.onended = function() { URL.revokeObjectURL(blobUrl); showDebug('HTML5 ended'); resolve(); };
    a.onerror = function(e) { URL.revokeObjectURL(blobUrl); showDebug('HTML5 err: ' + e); reject(new Error('HTML5 fail')); };
    a.play().then(function() { showDebug('HTML5 playing!'); }).catch(function(e) { URL.revokeObjectURL(blobUrl); showDebug('HTML5 rejected: ' + e); reject(e); });
    setTimeout(function() { a.pause(); URL.revokeObjectURL(blobUrl); resolve(); }, 30000);
  });
}

async function playDataUri(data: ArrayBuffer): Promise<void> {
  showDebug('Play: dataURI...');
  const bytes = new Uint8Array(data);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const uri = 'data:audio/mpeg;base64,' + btoa(bin);
  return new Promise<void>(function(resolve, reject) {
    const a = new Audio(uri);
    a.onended = function() { showDebug('dataURI ended'); resolve(); };
    a.onerror = function(e) { showDebug('dataURI err: ' + e); reject(new Error('dataURI fail')); };
    a.play().then(function() { showDebug('dataURI playing!'); }).catch(function(e) { showDebug('dataURI rejected: ' + e); reject(e); });
    setTimeout(function() { a.pause(); resolve(); }, 30000);
  });
}

async function tryPlay(ctx: AudioContext, data: ArrayBuffer): Promise<void> {
  try { await playWebAudio(ctx, data); return; }
  catch (e) { showDebug('WebAudio fail: ' + (e instanceof Error ? e.message : String(e))); }
  try { await playHtmlAudio(data.slice(0)); return; }
  catch (e) { showDebug('HTML5 fail: ' + (e instanceof Error ? e.message : String(e))); }
  try { await playDataUri(data.slice(0)); return; }
  catch (e) { showDebug('dataURI fail: ' + (e instanceof Error ? e.message : String(e))); }
  showDebug('ALL playback methods failed!');
}

async function speakGoogle(text: string, ctx: AudioContext): Promise<void> {
  currentSpeaking = true;
  const chunks = splitTextIntoChunks(text);
  showDebug('Chunks: ' + chunks.length);
  try {
    for (let i = 0; i < chunks.length; i++) {
      if (!currentSpeaking) break;
      const url = createAudioUrl(chunks[i]);
      showDebug('Chunk ' + (i + 1) + '/' + chunks.length);
      try {
        const data = await fetchAudio(url);
        showDebug('Got ' + data.byteLength + ' bytes');
        await tryPlay(ctx, data);
      } catch (e) {
        showDebug('Chunk ' + (i + 1) + ' FAIL: ' + (e instanceof Error ? e.message : String(e)));
      }
    }
  } finally {
    currentSpeaking = false;
    currentSource = null;
    showDebug('=== Done ===');
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
  showDebug('speakArabic native=' + isNative());
  const ctx = getAudioContext();
  if (isNative()) {
    showDebug('Using TTS proxy');
    speakGoogle(text, ctx);
  } else {
    if ('speechSynthesis' in window) {
      speakWeb(text);
    } else {
      speakGoogle(text, ctx);
    }
  }
}

export function stopSpeaking(): void {
  currentSpeaking = false;
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

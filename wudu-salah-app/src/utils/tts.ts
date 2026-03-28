// Arabic Text-to-Speech utility using Web Speech API
// Handles async voice loading on Android WebView (Capacitor)

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

    // Voices load asynchronously on most browsers/Android
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Timeout fallback - if voices never load, proceed without a specific voice
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

  // Prefer ar-SA, then any Arabic voice
  cachedArabicVoice = voices.find(v => v.lang === 'ar-SA') ||
    voices.find(v => v.lang.startsWith('ar')) ||
    null;

  return cachedArabicVoice;
}

// Initialize voices early
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Trigger voice loading
  window.speechSynthesis.getVoices();
  loadVoices().then(() => { voicesLoaded = true; });
}

export function speakArabic(text: string): void {
  // Stop any current speech
  stopSpeaking();

  if (!('speechSynthesis' in window)) {
    return;
  }

  const doSpeak = (voice: SpeechSynthesisVoice | null) => {
    // Cancel again in case something queued during voice loading
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    if (voice) {
      utterance.voice = voice;
    }

    // Android WebView workaround: speechSynthesis can get stuck
    // A small delay helps ensure the engine is ready
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);

      // Android WebView bug: speech can pause after ~15 seconds
      // Resume periodically to prevent this
      const resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10000);

      utterance.onend = () => clearInterval(resumeInterval);
      utterance.onerror = () => clearInterval(resumeInterval);
    }, 100);
  };

  // Try to get voice asynchronously, but don't block
  if (voicesLoaded) {
    doSpeak(cachedArabicVoice);
  } else {
    getArabicVoice().then(doSpeak);
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (!('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

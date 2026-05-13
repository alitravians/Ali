import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeRecognitionError,
  getSpeechRecognitionCtor,
  isVoiceInputSupported,
  type SpeechRecognitionLike,
} from "../lib/speech";

interface UseVoiceInputOptions {
  lang?: string;
  onTranscript: (text: string) => void;
  onError?: (msg: string) => void;
}

interface UseVoiceInputResult {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useVoiceInput({
  lang = "ar-SA",
  onTranscript,
  onError,
}: UseVoiceInputOptions): UseVoiceInputResult {
  const [supported] = useState<boolean>(() => isVoiceInputSupported());
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!supported) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = true;
    r.lang = lang;
    r.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
      }
      if (finalText.trim()) onTranscriptRef.current(finalText.trim());
    };
    r.onerror = (event) => {
      setListening(false);
      const msg = describeRecognitionError(event.error);
      if (msg) onErrorRef.current?.(msg);
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    return () => {
      try {
        r.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [supported, lang]);

  const start = useCallback(() => {
    if (!supported) {
      onErrorRef.current?.("متصفحك لا يدعم خاصية الإدخال الصوتي");
      return;
    }
    const r = recognitionRef.current;
    if (!r) {
      onErrorRef.current?.("حدث خطأ في تهيئة الإدخال الصوتي. أعد تحميل الصفحة.");
      return;
    }
    try {
      r.start();
      setListening(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already started")) {
        try {
          r.stop();
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          try {
            r.start();
            setListening(true);
          } catch {
            /* ignore */
          }
        }, 120);
      } else {
        onErrorRef.current?.("حدث خطأ أثناء بدء التسجيل. حاول مرة أخرى.");
      }
    }
  }, [supported]);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, start, stop, toggle };
}

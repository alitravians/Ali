'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Currently selected file (if any). */
  blob: Blob | null;
  url: string | null;
  onChange: (blob: Blob | null) => void;
  disabled?: boolean;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export default function StartingFrameUpload({ blob, url, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorRef.current) errorRef.current.textContent = '';
  }, [blob]);

  const showError = (msg: string) => {
    if (errorRef.current) errorRef.current.textContent = msg;
  };

  const handleFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      showError('الصيغة غير مدعومة. استخدم JPG أو PNG أو WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      showError('حجم الصورة كبير جداً. الحد الأقصى ٥ ميجابايت.');
      return;
    }
    onChange(file);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-brand-100">
          الإطار الافتتاحي (اختياري)
        </label>
        <span className="text-[10px] text-brand-200/50">JPG · PNG · WebP · حد ٥MB</span>
      </div>
      <p className="text-xs text-brand-200/60 leading-relaxed mb-4">
        ارفع صورة من جهازك لتكون أول إطار في الفيديو. الذكاء الاصطناعي يولّد بقية المشاهد ليتدرّج منها.
      </p>

      {!blob || !url ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-brand-400/30 hover:border-brand-400/60 hover:bg-brand-500/5 transition py-8 text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-2 text-brand-200/70">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm font-semibold text-brand-100">اضغط لرفع صورة</div>
            <div className="text-xs">أو اترك هذا الحقل فارغاً وسيُنشئ الذكاء الاصطناعي كل المشاهد</div>
          </div>
        </button>
      ) : (
        <div className="flex items-stretch gap-3">
          <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-black border border-brand-400/30 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="الإطار الافتتاحي" className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500 text-black font-bold">
              مشهد ١
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className="text-xs text-brand-200/80">
              <div className="font-semibold text-brand-100">صورتك جاهزة</div>
              <div className="text-brand-200/50 text-[11px] mt-0.5">
                {(blob.size / 1024).toFixed(0)} KB · {blob.type.replace('image/', '').toUpperCase()}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-lg border border-brand-400/30 hover:bg-brand-500/15 transition disabled:opacity-50"
              >
                استبدال
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-200 hover:bg-red-500/15 transition disabled:opacity-50"
              >
                إزالة
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={errorRef} className="mt-2 text-xs text-red-300 min-h-[1em]" aria-live="polite" />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // Reset value so the same file can be re-selected after removal
          e.target.value = '';
        }}
      />
    </div>
  );
}

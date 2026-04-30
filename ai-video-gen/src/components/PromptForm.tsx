'use client';

import { VIDEO_STYLES } from '@/lib/styles';
import type { Duration } from '@/lib/types';

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  duration: Duration;
  setDuration: (d: Duration) => void;
  styleId: string;
  setStyleId: (id: string) => void;
  onSubmit: () => void;
  busy: boolean;
}

const DURATIONS: Duration[] = [5, 10, 15];

const EXAMPLES = [
  'قطة فضائية تطفو في مجرة ملونة',
  'مدينة دبي ليلاً مع برج خليفة وألعاب نارية',
  'فارس عربي يمتطي حصانه على شاطئ ذهبي عند الغروب',
  'تنين ضخم يطير فوق جبال مغطاة بالثلج',
  'مقهى تراثي في القاهرة القديمة بضوء دافئ',
];

export default function PromptForm({
  prompt, setPrompt, duration, setDuration, styleId, setStyleId, onSubmit, busy,
}: Props) {
  return (
    <div className="card p-6 md:p-8">
      <label className="block text-sm font-semibold text-brand-100 mb-2">
        وصف المشهد
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="مثلاً: قطة فضائية تطفو في مجرة ملونة..."
        className="w-full bg-black/30 border border-brand-400/15 rounded-xl p-4 text-base placeholder:text-brand-200/30 focus:outline-none focus:border-brand-400/50 focus:ring-2 focus:ring-brand-500/20 resize-none transition"
        dir="auto"
      />
      <div className="flex justify-between items-center mt-1 text-xs text-brand-200/50">
        <span>{prompt.length} / 500</span>
        <span className="hidden md:inline">اكتب بالعربي أو الإنجليزي</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="text-xs px-3 py-1.5 rounded-full border border-brand-400/20 bg-black/20 hover:bg-brand-500/20 hover:border-brand-400/50 transition"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-brand-100 mb-3">
          مدة الفيديو
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`duration-pill rounded-xl py-4 font-bold text-lg ${duration === d ? 'active' : ''}`}
            >
              <div className="text-2xl">{d}</div>
              <div className="text-xs opacity-80">ثانية</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-brand-100 mb-3">
          الأسلوب الفني
        </label>
        <div className="flex flex-wrap gap-2">
          {VIDEO_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyleId(s.id)}
              className={`style-chip rounded-full px-4 py-2 text-sm ${styleId === s.id ? 'active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy || !prompt.trim()}
        className="btn-primary w-full mt-8 rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-3"
      >
        {busy ? (
          <>
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
            </svg>
            <span>جارٍ التوليد...</span>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 3v18M3 12h18" strokeLinecap="round" />
            </svg>
            <span>توليد الفيديو</span>
          </>
        )}
      </button>
    </div>
  );
}

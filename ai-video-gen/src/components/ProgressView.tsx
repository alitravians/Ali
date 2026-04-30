'use client';

interface Props {
  phase: string;
  progress: number;
  framesPreview: string[];
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'في الانتظار',
  'requesting': 'جلب الإطارات من الذكاء الاصطناعي',
  'downloading frames': 'تحميل الإطارات',
  'rendering clips': 'إنشاء المقاطع مع حركة الكاميرا',
  'joining clips': 'دمج المقاطع مع تأثير الانتقال',
  'finalizing': 'تجهيز الفيديو النهائي',
  'done': 'اكتمل',
  'error': 'خطأ',
};

export default function ProgressView({ phase, progress, framesPreview }: Props) {
  const label = PHASE_LABELS[phase] ?? phase;
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-brand-100">{label}</div>
        <div className="text-xs text-brand-200/60 tabular-nums">{pct}%</div>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-l from-brand-300 to-brand-500 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 shimmer opacity-40" />
      </div>

      {framesPreview.length > 0 && (
        <div className="mt-5">
          <div className="text-xs text-brand-200/60 mb-2">إطارات المشهد:</div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {framesPreview.map((url, i) => (
              <div
                key={i}
                className="aspect-video rounded-lg overflow-hidden bg-black/40 border border-brand-400/10 relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`frame ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/70 text-brand-100">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

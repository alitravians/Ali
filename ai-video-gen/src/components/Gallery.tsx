'use client';

import type { GeneratedVideo } from '@/lib/types';

interface Props {
  items: GeneratedVideo[];
  onSelect: (v: GeneratedVideo) => void;
  onClear: () => void;
}

export default function Gallery({ items, onSelect, onClear }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-brand-100">الفيديوهات السابقة</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-brand-200/60 hover:text-brand-200 transition"
        >
          مسح الكل
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v)}
            className="text-right group"
          >
            <div className="aspect-video rounded-lg overflow-hidden bg-black border border-brand-400/15 group-hover:border-brand-400/50 transition relative">
              <video
                src={v.url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" opacity="0.85">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </div>
              <div className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/70">
                {v.duration}s
              </div>
            </div>
            <div className="mt-2 text-xs text-brand-200/70 line-clamp-2">{v.prompt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

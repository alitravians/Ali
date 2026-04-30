'use client';

import { useState } from 'react';
import type { StoryboardFrame } from '@/lib/types';

interface Props {
  frames: StoryboardFrame[];
  onUpdateFrame: (index: number, updater: (f: StoryboardFrame) => StoryboardFrame) => void;
  onRemoveFrame: (index: number) => void;
  onMoveFrame: (from: number, to: number) => void;
  onCompose: () => void;
  onCancel: () => void;
  busy: boolean;
  minFrames: number;
}

/**
 * Storyboard editor — lets the user review, regenerate, edit, reorder,
 * or remove individual frames before committing to compose the video.
 */
export default function StoryboardEditor({
  frames,
  onUpdateFrame,
  onRemoveFrame,
  onMoveFrame,
  onCompose,
  onCancel,
  busy,
  minFrames,
}: Props) {
  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-brand-100 text-base">لوحة القصة (Storyboard)</h3>
          <p className="text-xs text-brand-200/60 mt-1 leading-relaxed">
            راجع المشاهد، عدّل وصف أي مشهد، أعد توليده بصورة جديدة، أو أعد ترتيبها قبل تركيب الفيديو النهائي.
          </p>
        </div>
        <div className="text-xs text-brand-200/60 whitespace-nowrap mt-1">
          {frames.length} مشاهد
        </div>
      </div>

      <div className="space-y-3">
        {frames.map((frame, i) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            index={i}
            isFirst={i === 0}
            isLast={i === frames.length - 1}
            canRemove={frames.length > minFrames}
            minFrames={minFrames}
            disabled={busy}
            onUpdate={(updater) => onUpdateFrame(i, updater)}
            onRemove={() => onRemoveFrame(i)}
            onMoveUp={() => onMoveFrame(i, i - 1)}
            onMoveDown={() => onMoveFrame(i, i + 1)}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-xl py-3 font-bold border border-brand-400/30 bg-black/30 hover:bg-brand-500/15 transition disabled:opacity-50"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={onCompose}
          disabled={busy}
          className="btn-primary rounded-xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" strokeLinecap="round" />
              </svg>
              <span>جارٍ التركيب...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 3l14 9-14 9V3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>تركيب الفيديو</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface FrameCardProps {
  frame: StoryboardFrame;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  minFrames: number;
  disabled: boolean;
  onUpdate: (updater: (f: StoryboardFrame) => StoryboardFrame) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function FrameCard({
  frame, index, isFirst, isLast, canRemove, minFrames, disabled,
  onUpdate, onRemove, onMoveUp, onMoveDown,
}: FrameCardProps) {
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(frame.prompt);

  const startEdit = () => {
    setDraftPrompt(frame.prompt);
    setEditingPrompt(true);
  };

  const saveEdit = () => {
    if (frame.source !== 'ai') {
      setEditingPrompt(false);
      return;
    }
    const trimmed = draftPrompt.trim();
    if (!trimmed) {
      setEditingPrompt(false);
      return;
    }
    onUpdate((f) => regenerateAi({ ...f, prompt: trimmed }));
    setEditingPrompt(false);
  };

  const regenerateSeed = () => {
    if (frame.source !== 'ai') return;
    onUpdate(regenerateAi);
  };

  return (
    <div className="rounded-xl border border-brand-400/15 bg-black/30 p-3">
      <div className="flex gap-3">
        <div className="relative w-32 md:w-40 aspect-video rounded-lg overflow-hidden bg-black border border-brand-400/20 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frame.url}
            alt={`مشهد ${index + 1}`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/80 text-brand-100 font-bold">
            مشهد {index + 1}
          </div>
          {frame.source === 'upload' && (
            <div className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500 text-black font-bold">
              صورتك
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {editingPrompt && frame.source === 'ai' ? (
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-brand-400/30 rounded-lg p-2 text-xs resize-none focus:outline-none focus:border-brand-400/60"
              dir="auto"
              autoFocus
            />
          ) : (
            <div className="text-xs text-brand-200/80 leading-relaxed line-clamp-3" dir="auto">
              {frame.source === 'upload' ? (
                <span className="italic text-brand-200/60">صورة مرفوعة من جهازك — لا تتأثر بالبرومت.</span>
              ) : (
                frame.prompt
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {frame.source === 'ai' && (
              <>
                {editingPrompt ? (
                  <>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={saveEdit}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-brand-500/30 hover:bg-brand-500/50 transition disabled:opacity-50"
                    >
                      حفظ + إعادة توليد
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setEditingPrompt(false)}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-brand-400/20 hover:bg-brand-500/10 transition disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={regenerateSeed}
                      title="توليد صورة جديدة بنفس الوصف"
                      className="text-[11px] px-2.5 py-1 rounded-md border border-brand-400/30 hover:bg-brand-500/15 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      إعادة توليد
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={startEdit}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-brand-400/30 hover:bg-brand-500/15 transition disabled:opacity-50"
                    >
                      تعديل الوصف
                    </button>
                  </>
                )}
              </>
            )}

            <div className="ms-auto flex gap-1.5">
              <button
                type="button"
                disabled={disabled || isFirst}
                onClick={onMoveUp}
                title="نقل لأعلى"
                className="text-[11px] w-7 h-7 rounded-md border border-brand-400/20 hover:bg-brand-500/15 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={disabled || isLast}
                onClick={onMoveDown}
                title="نقل لأسفل"
                className="text-[11px] w-7 h-7 rounded-md border border-brand-400/20 hover:bg-brand-500/15 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={disabled || !canRemove}
                onClick={onRemove}
                title={canRemove ? 'حذف هذا المشهد' : `لا يمكن الحذف — الحد الأدنى ${minFrames} مشاهد`}
                className="text-[11px] w-7 h-7 rounded-md border border-red-500/30 text-red-200 hover:bg-red-500/15 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Build a fresh Pollinations URL with a new seed for an AI frame.
 * Pure function so callers can use it inside `setState` updaters.
 */
function regenerateAi(frame: StoryboardFrame): StoryboardFrame {
  if (frame.source !== 'ai') return frame;
  const newSeed = Math.floor(Math.random() * 1_000_000);
  const params = new URLSearchParams({
    width: '1024',
    height: '576',
    nologo: 'true',
    model: 'flux',
    seed: String(newSeed),
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(frame.prompt)}?${params.toString()}`;
  return { ...frame, seed: newSeed, url };
}

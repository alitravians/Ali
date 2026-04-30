/**
 * Build a Pollinations.ai image URL. Free, no auth required.
 * Docs: https://image.pollinations.ai
 *
 * Note: anonymous users are rate-limited to 1 concurrent request per IP.
 * Since the actual fetch happens in the user's browser (not our server),
 * each user gets their own quota.
 */
export function buildPollinationsUrl(opts: {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  model?: string;
}): string {
  const { prompt, width = 1024, height = 576, seed, model = 'flux' } = opts;
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    model,
  });
  if (seed != null) params.set('seed', String(seed));
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

/**
 * For a given duration, decide how many keyframes to generate.
 * Each keyframe is a unique camera angle / progression of the prompt.
 */
export function framesForDuration(duration: 5 | 10 | 15): number {
  if (duration === 5) return 3;
  if (duration === 10) return 4;
  return 5;
}

/**
 * Generate per-frame prompt variations so the video tells a small visual story
 * rather than being a static image. We add directional/camera/time hints.
 */
export function buildFramePrompts(basePrompt: string, stylePrompt: string, count: number): string[] {
  const variations = [
    'wide establishing shot, golden hour',
    'medium shot, eye level, soft light',
    'close-up detail, shallow depth of field',
    'over the shoulder, dynamic angle',
    'low angle, dramatic perspective',
    'high angle aerial, sweeping view',
    'side profile, rim light',
    'tracking shot, motion blur background',
  ];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const variation = variations[i % variations.length];
    out.push(`${basePrompt}, ${variation}, ${stylePrompt}, masterpiece, highly detailed`);
  }
  return out;
}

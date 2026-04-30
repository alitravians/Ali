import { NextRequest, NextResponse } from 'next/server';
import { buildPollinationsUrl, buildFramePrompts, framesForDuration } from '@/lib/pollinations';

export const runtime = 'edge';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10; // 10 generations per minute per IP
const ipHits = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.reset < now) {
    ipHits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return { ok: true, remaining: RATE_MAX - 1, resetIn: RATE_WINDOW_MS };
  }
  if (entry.count >= RATE_MAX) {
    return { ok: false, remaining: 0, resetIn: entry.reset - now };
  }
  entry.count += 1;
  return { ok: true, remaining: RATE_MAX - entry.count, resetIn: entry.reset - now };
}

interface GenerateBody {
  prompt?: unknown;
  duration?: unknown;
  style?: unknown;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'تجاوزت الحد المسموح. حاول بعد دقيقة.', resetIn: rl.resetIn },
      { status: 429 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const duration = body.duration === 5 || body.duration === 10 || body.duration === 15 ? body.duration : null;
  const stylePrompt = typeof body.style === 'string' ? body.style.trim() : '';

  if (!prompt) {
    return NextResponse.json({ error: 'الوصف مطلوب' }, { status: 400 });
  }
  if (prompt.length > 500) {
    return NextResponse.json({ error: 'الوصف طويل جداً (الحد 500 حرف)' }, { status: 400 });
  }
  if (!duration) {
    return NextResponse.json({ error: 'المدة يجب أن تكون 5 أو 10 أو 15 ثانية' }, { status: 400 });
  }

  const count = framesForDuration(duration);
  const prompts = buildFramePrompts(prompt, stylePrompt, count);
  const baseSeed = Math.floor(Math.random() * 1_000_000);

  const frames = prompts.map((p, i) => {
    const seed = baseSeed + i * 7;
    return {
      index: i,
      prompt: p,
      seed,
      url: buildPollinationsUrl({
        prompt: p,
        width: 1024,
        height: 576,
        seed,
      }),
    };
  });

  return NextResponse.json({
    frames,
    duration,
    framesCount: count,
    rateLimit: { remaining: rl.remaining, resetIn: rl.resetIn },
  });
}

import { NextRequest, NextResponse } from "next/server";

// F17 — Force HTTP 404 (not 200) for clearly-invalid parent-link URLs.
//
// Background: Next.js (still in 15.5.x) streams the response with status 200
// the moment any ancestor `loading.tsx` is encountered. When the page later
// calls `notFound()`, the body swaps to the not-found UI but the already-sent
// 200 header cannot be changed. This is the well-known interaction tracked in
// vercel/next.js#76474.
//
// We don't want to lose `app/loading.tsx` (great UX on slow DB queries), so
// the workaround is to short-circuit *clearly bogus* tokens at the edge —
// before any rendering / streaming starts — and emit a real 404.
//
// What counts as "clearly bogus" for a parent-link token:
//   - Empty / missing
//   - Shorter than 16 chars (real tokens are 43 base64url chars = 32 raw bytes)
//   - Contains any character outside the base64url alphabet
//
// Tokens that *look* valid but don't exist in the DB still fall through to
// the page (which calls `notFound()` after the DB miss). Those cases will
// continue to return HTTP 200, but they're a vanishingly small surface:
// only someone who already knows the exact 43-char shape can hit them, and
// `metadata.robots = { index: false, follow: false }` keeps them out of any
// search index regardless of status.
const PARENT_TOKEN_RE = /^[A-Za-z0-9_-]{16,}$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/parent/")) {
    const token = pathname.slice("/parent/".length).split("/")[0] ?? "";
    if (!PARENT_TOKEN_RE.test(token)) {
      return new NextResponse(NOT_FOUND_HTML, {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only intercept the routes we actually need to harden. Leaves everything
  // else (api/, static assets, other pages) on the default fast path.
  matcher: ["/parent/:path*"],
};

// Minimal RTL Arabic 404 body. Mirrors `app/not-found.tsx` visually so the
// user sees no jarring difference from the in-app 404 page.
const NOT_FOUND_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>الصفحة غير موجودة — تفوّقي</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0; min-height: 100vh;
        display: grid; place-items: center;
        font-family: "Tajawal", system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #fff1f2, #f5f3ff, #f0f9ff);
        color: #312e81;
      }
      @media (prefers-color-scheme: dark) {
        body { background: #0b1020; color: #c4b5fd; }
      }
      .wrap { max-width: 32rem; padding: 3rem 1rem; text-align: center; }
      .icon { font-size: 4.5rem; margin-bottom: 1rem; }
      h1 { font-size: 1.875rem; font-weight: 900; margin: 0 0 .5rem; }
      p  { font-size: 1rem; opacity: .85; margin: 0 0 1.75rem; line-height: 1.7; }
      a {
        display: inline-block; padding: .65rem 1.25rem;
        background: linear-gradient(135deg, #c026d3, #7c3aed);
        color: #fff; border-radius: .75rem; font-weight: 700;
        text-decoration: none;
      }
      a:hover { filter: brightness(1.08); }
    </style>
  </head>
  <body>
    <main class="wrap">
      <div class="icon" aria-hidden="true">🧭</div>
      <h1>الصفحة غير موجودة</h1>
      <p>الرابط الذي فتحتِه غير صحيح أو تمّت إزالته.</p>
      <a href="/">الصفحة الرئيسية</a>
    </main>
  </body>
</html>`;

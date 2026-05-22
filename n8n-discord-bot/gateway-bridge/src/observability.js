// Sentry error monitoring for the Discord -> n8n gateway bridge.
//
// Sentry init is intentionally optional — when SENTRY_DSN is unset (local
// dev, CI lint, anyone forking the bridge) every helper here becomes a
// cheap no-op so the process still starts and runs identically to before.
//
// Operationally, set the DSN as a Fly.io secret:
//
//     flyctl secrets set SENTRY_DSN='https://<key>@oXXX.ingest.de.sentry.io/YYY'
//
// Optional env vars:
//
//     SENTRY_ENVIRONMENT          default: production
//     SENTRY_RELEASE              default: unset (Sentry auto-detects git SHA)
//     SENTRY_TRACES_SAMPLE_RATE   default: 0.0 (errors only — cheaper)

let _initialized = false;
let _sentry = null;

export async function initSentry() {
  if (_initialized) return true;

  const dsn = (process.env.SENTRY_DSN || '').trim();
  if (!dsn) {
    console.log('[sentry] SENTRY_DSN unset — Sentry disabled');
    return false;
  }

  try {
    _sentry = await import('@sentry/node');
  } catch (err) {
    console.warn('[sentry] @sentry/node not installed — Sentry disabled');
    return false;
  }

  let sampleRate = 0.0;
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) sampleRate = parsed;
  }

  try {
    _sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || 'production',
      release: process.env.SENTRY_RELEASE || undefined,
      tracesSampleRate: sampleRate,
      // Discord bot tokens, bridge HMAC secrets, and n8n webhook URLs must
      // never leave the process. ``sendDefaultPii`` defaults to false
      // already; pin it explicitly so a future SDK default flip can't
      // surprise us.
      sendDefaultPii: false,
      maxBreadcrumbs: 50,
    });
  } catch (err) {
    // @sentry/node.init is extremely defensive today, but observability is
    // optional and must NEVER take the bridge down. Log and fall through
    // to the disabled state. Null out _sentry so a later helper can't
    // accidentally use a half-initialized SDK if the dynamic import
    // succeeded but init() rejected.
    console.error('[sentry] init failed — Sentry disabled:', err?.message);
    _sentry = null;
    return false;
  }

  _initialized = true;
  console.log(
    `[sentry] initialized (env=${process.env.SENTRY_ENVIRONMENT || 'production'})`,
  );
  return true;
}

// Capture an exception with optional extra context. No-op if disabled.
//
// Extras are scoped to this single call via ``withScope()`` so they
// cannot leak into unrelated Sentry events fired later (e.g. another
// gateway event raised on the same client instance).
export function captureException(err, extra = {}) {
  if (!_initialized || !_sentry) return;
  try {
    _sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(extra)) {
        scope.setExtra(key, value);
      }
      _sentry.captureException(err);
    });
  } catch {
    // Last-resort guard: a broken Sentry transport must never crash the
    // caller. Swallow and move on.
  }
}

// Drain the in-memory Sentry transport buffer (up to ``timeoutMs``),
// returning true on a full flush and false on timeout / when Sentry is
// disabled. The shutdown paths await this right before ``process.exit``
// so an uncaught crash or a SIGTERM doesn't drop the final error report
// into /dev/null.
//
// Uses ``flush()`` (non-destructive — SDK keeps accepting events after)
// rather than ``close()`` so a future caller can drain buffered events
// from a long-running context (e.g. a periodic health-check endpoint)
// without silently killing Sentry for the rest of the process.
export async function flushSentry(timeoutMs = 2000) {
  if (!_initialized || !_sentry) return false;
  try {
    return await _sentry.flush(timeoutMs);
  } catch {
    return false;
  }
}

// Wire up Node's global crash handlers so an uncaught throw on a
// background promise or in an event listener doesn't disappear into
// stderr. discord.js intentionally swallows event-listener errors in
// some cases, so without this they would be invisible in production.
export function installGlobalErrorHandlers() {
  if (!_initialized) return;
  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    captureException(err, { source: 'unhandledRejection' });
  });
  process.on('uncaughtException', (err) => {
    // Registering a listener for 'uncaughtException' overrides Node's
    // default behavior of printing + exiting, so we must:
    //   1. capture the event,
    //   2. await the Sentry transport flush (otherwise the buffered
    //      report dies with the process before it reaches Sentry),
    //   3. then exit — a crashed process must NOT keep serving
    //      requests with potentially corrupt in-memory state.
    captureException(err, { source: 'uncaughtException' });
    console.error('[fatal] uncaughtException', err);
    flushSentry(2000).finally(() => process.exit(1));
  });
}

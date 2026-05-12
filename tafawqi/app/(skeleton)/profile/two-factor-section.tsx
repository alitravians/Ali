"use client";

import { useEffect, useState } from "react";

export default function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const [active, setActive] = useState(enabled);
  const [stage, setStage] = useState<"idle" | "enroll" | "verify" | "disable">("idle");
  const [secret, setSecret] = useState("");
  const [otpAuth, setOtpAuth] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  useEffect(() => {
    if (!otpAuth) return setQrSrc("");
    // Use a public QR-code image service to avoid bundling a QR lib.
    // The provisioning URL is short and contains no secrets the server doesn't
    // already know about (the admin chose this account/issuer themselves).
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpAuth)}`;
    setQrSrc(url);
  }, [otpAuth]);

  async function begin() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "begin" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: json.error || "تعذّر بدء الإعداد." });
      } else {
        setSecret(json.secret);
        setOtpAuth(json.otpAuthUrl);
        setStage("verify");
      }
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", secret, code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: json.error || "فشل التحقّق." });
      } else {
        setActive(true);
        setStage("idle");
        setSecret("");
        setOtpAuth("");
        setCode("");
        setMsg({ kind: "ok", text: "تم تفعيل التحقّق الثنائي." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: json.error || "فشل التعطيل." });
      } else {
        setActive(false);
        setStage("idle");
        setCode("");
        setMsg({ kind: "ok", text: "تم تعطيل التحقّق الثنائي." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 mb-6">
      <div className="font-bold text-violet-900 dark:text-violet-100 mb-1">
        🔐 التحقّق الثنائي (2FA)
      </div>
      <p className="text-sm text-violet-600/90 dark:text-violet-300/80 mb-4 leading-relaxed">
        طبقة حماية إضافيّة لحساب الإدارة عبر تطبيق مصادقة (Google Authenticator أو Authy أو
        1Password). عند الدخول سيُطلب منكِ رمز مكوّن من ٦ أرقام بعد كلمة المرور.
      </p>

      {msg && (
        <div
          className={[
            "mb-3 text-sm rounded-lg p-3",
            msg.kind === "ok"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200",
          ].join(" ")}
        >
          {msg.text}
        </div>
      )}

      {stage === "idle" && (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={[
              "chip",
              active
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
            ].join(" ")}
          >
            {active ? "مفعّل" : "غير مفعّل"}
          </span>
          {active ? (
            <button
              type="button"
              onClick={() => setStage("disable")}
              className="btn-secondary px-4"
            >
              تعطيل
            </button>
          ) : (
            <button type="button" onClick={begin} disabled={busy} className="btn-primary px-4">
              {busy ? "..." : "إعداد التحقّق الثنائي"}
            </button>
          )}
        </div>
      )}

      {stage === "verify" && (
        <form onSubmit={verify} className="space-y-3">
          <div className="text-sm text-violet-700/90 dark:text-violet-200/85 leading-relaxed">
            ١. افتحي تطبيق المصادقة وامسحي رمز QR، أو أضيفي المفتاح يدويّاً.
          </div>
          {qrSrc && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="QR code"
                width={220}
                height={220}
                className="rounded-lg border border-violet-200 dark:border-violet-800 bg-white p-2"
              />
              <div className="text-xs font-mono break-all text-center bg-violet-50/60 dark:bg-violet-900/20 rounded p-2">
                {secret}
              </div>
            </div>
          )}
          <div className="text-sm text-violet-700/90 dark:text-violet-200/85">
            ٢. أدخلي الرمز المكوّن من ٦ أرقام الذي يعرضه التطبيق:
          </div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input w-40 text-center tracking-widest text-lg"
            placeholder="٠٠٠٠٠٠"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary px-4" disabled={busy || code.length < 6}>
              {busy ? "..." : "تأكيد التفعيل"}
            </button>
            <button
              type="button"
              className="btn-secondary px-4"
              onClick={() => {
                setStage("idle");
                setSecret("");
                setOtpAuth("");
                setCode("");
                setMsg(null);
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {stage === "disable" && (
        <form onSubmit={disable} className="space-y-3">
          <div className="text-sm text-violet-700/90 dark:text-violet-200/85">
            للتأكّد من هويّتكِ، أدخلي الرمز الحاليّ من تطبيق المصادقة:
          </div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input w-40 text-center tracking-widest text-lg"
            placeholder="٠٠٠٠٠٠"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              disabled={busy || code.length < 6}
            >
              {busy ? "..." : "تأكيد التعطيل"}
            </button>
            <button
              type="button"
              className="btn-secondary px-4"
              onClick={() => {
                setStage("idle");
                setCode("");
                setMsg(null);
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

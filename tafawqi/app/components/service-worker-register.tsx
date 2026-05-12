"use client";

// F9 — Register the service worker once on first paint. We deliberately
// do not auto-update prompt the user; the cache is set to network-first
// for HTML so they always get fresh content online.
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent — PWA is progressive enhancement only.
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}

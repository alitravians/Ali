// WarScope PWA Service Worker — offline support + push notifications
// IMPORTANT: Bump version on every deployment to force cache refresh
const CACHE_NAME = 'warscope-v3';
const OFFLINE_URL = '/';

// Only cache truly static assets — NOT the HTML shell (it changes with each build)
const PRECACHE_URLS = [
  '/favicon.svg',
  '/manifest.json',
];

// Install: pre-cache core assets + force activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches aggressively
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first strategy, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET and API/WS requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.protocol === 'ws:' || url.protocol === 'wss:') return;
  // Skip external tile/font requests
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL));
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'WarScope', body: 'تنبيه جديد', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      dir: 'rtl',
      lang: 'ar',
      tag: 'warscope-alert',
      renotify: true,
      data: { url: data.url },
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  // Resolve against the service worker scope so we can compare pathnames
  // correctly and pass a fully-qualified URL to client.navigate().
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Prefer an existing same-origin window. If its current location
      // doesn't already match the notification target, navigate it there —
      // otherwise clicking a breaking-news ping silently returns users to
      // whichever page they had open last, making the notification useless.
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) continue;
        if ('focus' in client) {
          const focused = client.focus();
          try {
            const currentPath = new URL(client.url).pathname;
            const targetPath = new URL(absoluteUrl).pathname;
            if (currentPath !== targetPath && 'navigate' in client) {
              return Promise.resolve(focused).then(() => client.navigate(absoluteUrl));
            }
          } catch (_) {
            // Malformed URL — fall through to plain focus.
          }
          return focused;
        }
      }
      return self.clients.openWindow(absoluteUrl);
    })
  );
});

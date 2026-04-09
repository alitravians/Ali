// Kill-switch service worker - unregisters itself immediately
// This replaces any old cached service worker that was breaking tile loading
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.registration.unregister();
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.navigate(client.url));
  });
});

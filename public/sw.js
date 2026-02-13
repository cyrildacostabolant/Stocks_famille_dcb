
const CACHE_NAME = 'stock-famille-dcb-v2';

self.addEventListener('install', (event) => {
  // Le service worker s'installe et force l'attente pour devenir actif immédiatement
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Le service worker prend le contrôle de tous les clients immédiatement
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Stratégie Network First simple pour une PWA toujours à jour
  event.respondWith(fetch(event.request).catch(() => {
    // Fallback offline (si nécessaire à l'avenir)
    return new Response("Vous êtes hors ligne.");
  }));
});

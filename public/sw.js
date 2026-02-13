
const CACHE_NAME = 'stock-famille-dcb-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On essaie de mettre en cache la page d'accueil pour le mode hors ligne
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.warn('Cache install warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si c'est une navigation vers une page HTML, on renvoie l'index.html du cache
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response("Hors connexion");
        });
      })
  );
});

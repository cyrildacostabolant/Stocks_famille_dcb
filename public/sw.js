// Simple Service Worker pour permettre l'installation PWA (Add to Home Screen)
const CACHE_NAME = 'stocks-dcb-v1';

self.addEventListener('install', (event) => {
  // Force l'activation immédiate
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Prend le contrôle des pages immédiatement
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Stratégie simple : on passe tout au réseau.
  // Pour une vraie gestion hors-ligne, il faudrait mettre en cache les assets ici.
  event.respondWith(fetch(event.request));
});
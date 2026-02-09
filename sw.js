// Service Worker COGEPAM PWA
const CACHE_NAME = 'cogepam-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/site.webmanifest',
  // CSS
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  // JS
  'https://cdn.jsdelivr.net/npm/chart.js',
  // Images statiques essentielles
  '/images/logo-cogepam.png',
  '/images/background.png'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => console.log('[SW] Erreur cache:', err))
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch : stratégie Cache First, puis Network
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Ignorer les requêtes vers d'autres domaines (sauf Google Fonts/CDN)
  const url = new URL(event.request.url);
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retourner le cache si existant
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Sinon, fetch réseau
      return fetch(event.request)
        .then((networkResponse) => {
          // Ne pas mettre en cache les réponses non valides
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // Mettre en cache la nouvelle ressource
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        })
        .catch(() => {
          // Fallback si offline et pas en cache
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Gestion des notifications push (optionnel)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle mise à jour COGEPAM',
    icon: 'images/icons/icon-192x192.png',
    badge: 'images/icons/icon-72x72.png',
    tag: 'cogepam-notification',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('COGEPAM', options)
  );
});
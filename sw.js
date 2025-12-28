
const CACHE_NAME = 'repocontext-v2';

const STATIC_ASSETS = [
  '/',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with individual error catching if needed, 
      // but here we keep it simple for the core shell.
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip GitHub API - always live
  if (url.hostname.includes('github.com')) {
    return;
  }

  // Stale-while-revalidate for CDN assets (Tailwind, React)
  if (url.hostname.includes('esm.sh') || url.hostname.includes('tailwindcss.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache first for local assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

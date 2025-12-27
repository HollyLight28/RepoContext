
const CACHE_NAME = 'repocontext-v1';

// App Shell files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/services/githubService.ts',
  '/components/Header.tsx',
  '/components/Input.tsx',
  '/components/Button.tsx',
  '/components/ProgressBar.tsx',
  '/components/ResultCard.tsx',
  '/components/FileTree.tsx',
  '/components/History.tsx',
  '/assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
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
            console.log('[Service Worker] Removing old cache', key);
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

  // 1. API Strategy: Network Only
  // We never want to cache GitHub API responses blindly, as repo content changes.
  if (url.hostname === 'api.github.com') {
    return;
  }

  // 2. External Libraries (esm.sh, tailwind): Stale-While-Revalidate
  // Cache them for speed, but update in background if versions change.
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.tailwindcss.com') {
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

  // 3. App Shell / Local Assets: Cache First, falling back to Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

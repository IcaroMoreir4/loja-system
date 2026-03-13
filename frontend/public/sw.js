const CACHE_NAME = 'loula-control-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/manifest.json'
            ]).catch(() => console.log('Could not cache initial assets'));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Just pass through or network first to satisfy PWA criteria without aggressive caching
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

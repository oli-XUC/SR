const CACHE_NAME = 'service-report-github-pages-v19';
const GENERATED_PDF_CACHE = 'service-report-generated-pdf-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/industrial-header.png',
  './assets/customer-care-footer.png',
  './assets/html2canvas.min.js',
  './assets/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME && key !== GENERATED_PDF_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(GENERATED_PDF_CACHE)
        .then(cache => cache.match(event.request))
        .then(cachedPdf => {
          if (cachedPdf) return cachedPdf;

          return fetch(event.request)
            .then(response => {
              if (response.ok) {
                const responseCopy = response.clone();
                event.waitUntil(
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put('./index.html', responseCopy))
                );
              }
              return response;
            })
            .catch(() =>
              caches.match(event.request)
                .then(cached => cached || caches.match('./index.html'))
            );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return new Response('Offline resource not cached', { status: 503 });
    })
  );
});

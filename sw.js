self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('sirutawa-v1').then((cache) => cache.addAll(['/'])));
});
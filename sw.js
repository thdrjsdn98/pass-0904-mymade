// 간단한 오프라인 캐시용 서비스워커 (네트워크 우선 방식)
// 버전을 올리면(CACHE_NAME 변경) 예전 캐시를 지우고 새 파일로 갱신됩니다.
const CACHE_NAME = 'sobang2gup-cache-v5';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './parts/part1-1.html',
  './parts/part1-2.html',
  './parts/part2-1.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 우선: 인터넷 되면 항상 최신 파일을 먼저 시도하고,
// 안 되거나 실패하면 그때만 저장해둔 캐시를 보여줌
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response && response.status === 200 && event.request.method === 'GET') {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

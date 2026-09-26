/* Gastos do Mês — service worker: funciona offline depois da primeira abertura. */
const VERSAO = 'gastos-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // página: tenta a rede primeiro (para pegar atualizações), cai no cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone(); caches.open(VERSAO).then(c => c.put('./index.html', copia)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // fontes do Google e arquivos do app: cache primeiro
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return r;
    })));
  }
});

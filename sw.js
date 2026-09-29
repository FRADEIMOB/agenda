// Service worker da Minha Agenda: permite instalar como aplicativo e abrir mesmo sem internet
const CACHE = 'minha-agenda-v4';
const ARQUIVOS = ['./', './index.html', './manifest.json', './frade-icone-192.png', './frade-icone-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './frade-icone-180.png', './logo-frade.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Páginas: tenta a internet primeiro (sempre a versão mais nova) e usa a cópia guardada se estiver sem sinal
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase e fontes seguem direto
  e.respondWith(
    // páginas e arquivos do app sempre conferem se há versão nova (sem usar cópia velha do navegador)
    fetch(req, { cache:'no-cache' }).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

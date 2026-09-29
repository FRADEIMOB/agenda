// Service worker da Minha Agenda: permite instalar como aplicativo, abrir sem internet e receber notificações
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp({ apiKey:'AIzaSyA6o_z10mWoncQVnCjTRkTAp5PPQVwnC5g', authDomain:'agenda-37236.firebaseapp.com', projectId:'agenda-37236',
    storageBucket:'agenda-37236.firebasestorage.app', messagingSenderId:'920001274674', appId:'1:920001274674:web:6e9451fcede374a3be6d2b' });
  firebase.messaging(); // mostra sozinho as notificações que chegam com o app fechado
} catch(e) {}

// Ao tocar na notificação, abre (ou traz para frente) o app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.FCM_MSG && e.notification.data.FCM_MSG.data && e.notification.data.FCM_MSG.data.link) || './';
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(ws => {
    for (const w of ws) if (w.url.includes('/agenda/') && 'focus' in w) return w.focus();
    return clients.openWindow(link);
  }));
});
const CACHE = 'minha-agenda-v5';
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

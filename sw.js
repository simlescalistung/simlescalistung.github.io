/* ============================================================================
   Service Worker SIMLes Calistung (pola skill "pwa-installable")
   • Tampilan aplikasi (HTML/CSS/JS/ikon) cache-first → terbuka instan & tetap tampil saat offline
   • Data ke Google Apps Script TIDAK pernah di-cache (selalu langsung ke server;
     antrean simpan offline sudah ditangani aplikasi sendiri)
   • js/config.js selalu dicek terbaru (network-first) agar ganti URL backend langsung berlaku
   • Update berversi → naikkan VERSION setiap kali file frontend berubah
   ========================================================================== */
const VERSION = 'simles-v1.7.1';
const SPA = true;                        // routing pakai #. Yang diinstal hanya app.html (login admin & guru)
const OFFLINE_PAGE = 'offline.html';

const SHELL = [
  './',
  'index.html',
  'app.html',
  'manifest.webmanifest',
  'offline.html',
  'pwa.js',
  'css/style.css',
  'js/config.js',
  'js/icons.js',
  'js/core.js',
  'js/rules.js',
  'js/kuitansi.js',
  'js/public.js',
  'js/app.js',
  'js/admin.js',
  'js/admin2.js',
  'js/admin3.js',
  'js/promosi.js',
  'js/piagam.js',
  'assets/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

// Backend Google Apps Script → selalu langsung ke jaringan
const API_HOSTS = [
  /(^|\.)script\.google\.com$/,
  /(^|\.)script\.googleusercontent\.com$/
];
const NETWORK_ONLY_PATHS = [/\/api\//, /\/exec$/];
// File yang selalu dicek terbaru dulu (cadangan dari cache bila offline)
const NETWORK_FIRST = [/\/js\/config\.js$/];
// Font & pustaka CDN → simpan, perbarui di latar
const CDN_HOSTS = /fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$|cdn\.jsdelivr\.net$|unpkg\.com$/;

const RUNTIME = VERSION + '-rt';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch((err) => console.warn('[SW] gagal cache', u, err))));
  })());
  // Tidak langsung skipWaiting: pwa.js menampilkan banner "Versi baru tersedia" dulu.
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING' || (e.data && e.data.type === 'SKIP_WAITING')) self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== RUNTIME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                                         // POST tidak pernah di-cache
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (API_HOSTS.some((re) => re.test(url.hostname))) return;                 // backend → langsung ke server
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && NETWORK_ONLY_PATHS.some((re) => re.test(url.pathname))) return;

  if (req.mode === 'navigate') { e.respondWith(handleNavigate(req, url)); return; }

  if (sameOrigin && NETWORK_FIRST.some((re) => re.test(url.pathname))) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  if (sameOrigin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); }
      return res;
    })));
    return;
  }
  if (CDN_HOSTS.test(url.hostname)) {
    e.respondWith(caches.open(RUNTIME).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});

async function handleNavigate(req, url) {
  const c = await caches.open(VERSION);
  let key = url.href.split(/[?#]/)[0].slice(self.registration.scope.length);
  if (key === '' || key.endsWith('/')) key += 'index.html';
  if (SPA && !/\.html?$/.test(key)) key = 'index.html';
  // Landing page (index.html) bukan bagian aplikasi terinstal → selalu ambil terbaru dari internet,
  // cache hanya cadangan saat offline (mis. membuka link kuitansi tanpa sinyal)
  if (key === 'index.html') {
    return fetch(req).then((res) => { if (res.ok && res.type === 'basic') c.put(key, res.clone()); return res; })
      .catch(async () => (await c.match(key)) || (await c.match(OFFLINE_PAGE)) || Response.error());
  }
  const hit = (await c.match(key)) || (await c.match(req, { ignoreSearch: true }));
  const net = fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') c.put(key, res.clone());
    return res;
  }).catch(async () => hit || (await c.match(OFFLINE_PAGE)) || Response.error());
  return hit || net;
}

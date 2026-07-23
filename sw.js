
/* ============================================================================
   PSIP Tracker — Service Worker (Krok 10)
   Strategia:
   - Powłoka aplikacji (index.html, manifest, ikony, Chart.js) w cache —
     aplikacja startuje offline.
   - Nawigacja (wejście na stronę): NAJPIERW SIEĆ (zespół zawsze dostaje
     najnowszą wersję), a dopiero przy braku sieci — kopia z cache.
   - Zapytania do Apps Script (script.google.com / googleusercontent.com):
     NIGDY nie przechwytywane ani nie cache'owane — dane zawsze świeże,
     a offline'owe zapisy obsługuje kolejka w samej aplikacji.
   PO KAŻDYM WDROŻENIU nowej wersji index.html podbij CACHE_NAME poniżej
   (np. ...-v1.1), żeby stali użytkownicy dostali świeżą powłokę.
   ============================================================================ */
const CACHE_NAME = 'psip-tracker-v1.32.0';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const CDN_CHART = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
 
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Chart.js dokładamy osobno — jego ewentualny błąd (CDN, sieć) nie może
      // zablokować instalacji całej powłoki.
      return cache.addAll(SHELL).then(function () {
        return cache.add(CDN_CHART).catch(function () {});
      });
    }).then(function () { return self.skipWaiting(); })
  );
});
 
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});
 
// v1.20 — kliknięcie powiadomienia systemowego: przenieś na już otwartą kartę
// PSIP (i przekaż jej portal do otwarcia), a jeśli żadna nie jest otwarta —
// otwórz aplikację.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const c of list) {
        if ('focus' in c) {
          try { c.postMessage({ psipNotificationClick: true, pid: data.pid || null, sid: data.sid || null }); } catch (e) {}
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
 
// v1.20 — SZKIELET pod przyszły PEŁNY web-push (gdy pojawi się serwer push
// wysyłający zaszyfrowane komunikaty; patrz plan „powiadomienia przy zamkniętej
// aplikacji"). Bez serwera to zdarzenie po prostu nigdy nie przychodzi — jest
// całkowicie nieszkodliwe i gotowe na podpięcie.
self.addEventListener('push', function (event) {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch (e) { payload = { body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'PSIP Tracker';
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: payload.data || {}
  }));
});
 
self.addEventListener('fetch', function (event) {
  const url = event.request.url;
 
  // API danych (Apps Script) — nie dotykamy: ani cache, ani przechwytywania.
  if (url.indexOf('script.google.com') !== -1 || url.indexOf('googleusercontent.com') !== -1) {
    return;
  }
  if (event.request.method !== 'GET') return;
 
  // version.json (Krok "dostępna nowa wersja") — NIGDY z cache. Sens tego
  // pliku to właśnie wykrycie, że jest coś nowszego niż to, co siedzi w
  // cache'u Service Workera — cache-first zniszczyłby cały mechanizm
  // (klient sprawdzałby wiecznie tę samą, zapamiętaną odpowiedź).
  if (url.indexOf('version.json') !== -1) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
 
  // Nawigacja → sieć najpierw, fallback do powłoki z cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }
 
  // Pozostałe GET (ikony, manifest, Chart.js) → cache najpierw, sieć w tle uzupełnia.
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (res) {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, copy); });
        }
        return res;
      });
    })
  );
});
 

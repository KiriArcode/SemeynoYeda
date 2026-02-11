/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Precached assets (JS, CSS, etc.) — injected by vite-plugin-pwa. Без index.html.
precacheAndRoute(self.__WB_MANIFEST);

// Navigation (document): Network First — после деплоя всегда тянем свежий index.html,
// иначе старый SW отдаёт кэшированный HTML со старыми хешами CSS/JS → 404.
const documentStrategy = new NetworkFirst({
  cacheName: 'document-cache',
  networkTimeoutSeconds: 5,
});

registerRoute(
  new NavigationRoute(documentStrategy, {
    denylist: [/^\/api\//],
  })
);

// Внешние ресурсы (шрифты) — CacheFirst
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
  })
);
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
  })
);

// Только активный worker может вызывать clients.claim() — делаем это в activate после skipWaiting.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

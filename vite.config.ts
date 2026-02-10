import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'SemeynoYeda — Семейная еда',
        short_name: 'СемейноЕда',
        description: 'Планировщик семейного питания',
        theme_color: '#39FF14',
        background_color: '#0B0E14',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Отключаем минификацию SW (terser), чтобы сборка не падала с "Unexpected early exit"
        // на Vercel и в CI (race между rollup и workbox-build).
        mode: 'development',
        // Включаем index.html в precache — иначе createHandlerBoundToURL('index.html') падает.
        // Раньше исключали index.html, чтобы после деплоя не отдавать старый HTML, но тогда
        // SW ломается с "non-precached-url". С autoUpdate новый SW активируется при следующей загрузке.
        globPatterns: ['**/*.html', '**/*.{js,css,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 } },
          },
        ],
      },
    }),
  ],
});

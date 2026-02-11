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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      injectManifest: {
        // Не кэшируем index.html в precache — документ отдаём через NetworkFirst в sw.ts,
        // иначе после деплоя старый SW отдаёт старый HTML со старыми хешами CSS/JS → 404.
        globPatterns: ['**/*.{js,css,ico,png,svg,json,woff2}'],
      },
      manifest: {
        name: 'SemeynoYeda — Семейная еда',
        short_name: 'СемейноЕда',
        description: 'Планировщик семейного питания',
        theme_color: '#39FF14',
        background_color: '#0B0E14',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        mode: 'development',
      },
    }),
  ],
});

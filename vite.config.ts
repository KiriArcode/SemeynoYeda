import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/SemeynoYeda/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA plugin временно отключен для деплоя
    // Раскомментируйте после настройки иконок
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['vite.svg'],
    //   manifest: {
    //     name: 'SemeynoYeda — Семейная еда',
    //     short_name: 'СемейноЕда',
    //     description: 'Планировщик семейного питания',
    //     theme_color: '#39FF14',
    //     background_color: '#0B0E14',
    //     display: 'standalone',
    //     start_url: '/SemeynoYeda/',
    //     icons: [
    //       { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' },
    //     ],
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    //   },
    // }),
  ],
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './app/Router';
import { syncService } from './lib/syncService';
import './styles/globals.css';

// При 404 на чанке (устаревший кэш после деплоя) — перезагрузка страницы
// загружает свежий index.html и корректные ссылки на чанки
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => window.location.reload());
}

// Восстанавливаем путь из sessionStorage если был редирект с 404.html
// Это нужно делать ДО инициализации Router
const savedPath = sessionStorage.getItem('404-redirect-path');
if (savedPath) {
  sessionStorage.removeItem('404-redirect-path');
  window.history.replaceState(null, '', savedPath);
}

// Данные теперь через API (dataService). База — Neon/Postgres на сервере.
// Seed: npx tsx scripts/seedNeon.ts (после настройки DATABASE_URL)

// Инициализация синхронизации IndexedDB ↔ Neon
if (typeof window !== 'undefined') {
  syncService.initialize().catch((error) => {
    console.error('[main] Ошибка инициализации синхронизации:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);

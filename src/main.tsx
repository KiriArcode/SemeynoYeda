import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './app/Router';
import { initializeDatabase } from './lib/initDb';
import { logger } from './lib/logger';
import { syncService } from './lib/syncService';
import './styles/globals.css';

// При 404 на чанке (устаревший кэш после деплоя) — перезагрузка страницы
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => window.location.reload());
}

const savedPath = sessionStorage.getItem('404-redirect-path');
if (savedPath) {
  sessionStorage.removeItem('404-redirect-path');
  window.history.replaceState(null, '', savedPath);
}

// Seed IndexedDB при старте (рецепты и меню). Без этого на статичном деплое (Vercel) данные пустые.
const initApp = async () => {
  if (typeof window === 'undefined') return;
  try {
    await initializeDatabase();
  } catch (error) {
    logger.error('[main] Ошибка инициализации БД:', error);
  }
  syncService.initialize().catch((error) => {
    logger.error('[main] Ошибка инициализации синхронизации:', error);
  });
};

initApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);

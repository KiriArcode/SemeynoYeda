import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './app/Router';
import { initializeDatabase } from './lib/initDb';
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

// Инициализируем базу данных при загрузке приложения
initializeDatabase().catch((error) => {
  console.error('Ошибка при инициализации базы данных:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);

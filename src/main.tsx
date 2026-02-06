import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './app/Router';
import { initializeDatabase } from './lib/initDb';
import './styles/globals.css';

// Восстанавливаем путь из sessionStorage если был редирект с 404.html
// Это нужно делать ДО инициализации Router
const savedPath = sessionStorage.getItem('404-redirect-path');
if (savedPath) {
  sessionStorage.removeItem('404-redirect-path');
  // Восстанавливаем оригинальный путь через history API
  // React Router определит маршрут из window.location.pathname
  if (savedPath.startsWith('/SemeynoYeda')) {
    window.history.replaceState(null, '', savedPath);
  }
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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './app/Router';
import { initializeDatabase } from './lib/initDb';
import './styles/globals.css';

// Инициализируем базу данных при загрузке приложения
initializeDatabase().catch((error) => {
  console.error('Ошибка при инициализации базы данных:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);

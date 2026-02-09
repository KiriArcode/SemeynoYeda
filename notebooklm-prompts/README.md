# Промпты для NotebookLM — SemeynoYeda

Набор промптов для поиска материалов по различным темам проекта SemeynoYeda. Каждый промпт оптимизирован для контекстного окна NotebookLM (~30 строк).

## Структура

Каждый промпт содержит:
- **Контекст проекта** — краткое описание SemeynoYeda
- **Задача** — конкретные темы для поиска
- **Формат результатов** — структура ответа
- **Инструкции** — дополнительные указания

## Список промптов

### Высокий приоритет

1. **[01-react-typescript.md](01-react-typescript.md)** — React 18 + TypeScript
2. **[04-neon-postgresql.md](04-neon-postgresql.md)** — Neon PostgreSQL (основная БД)
3. **[04-dexie-indexeddb.md](04-dexie-indexeddb.md)** — Dexie.js (IndexedDB для кэша)
4. **[05-pwa.md](05-pwa.md)** — PWA (Progressive Web Apps)
5. **[07-offline-first.md](07-offline-first.md)** — Offline-First архитектура
6. **[14-react-performance.md](14-react-performance.md)** — Оптимизация React приложений

### Средний приоритет

7. **[02-vite.md](02-vite.md)** — Vite 5
8. **[03-tailwind-css.md](03-tailwind-css.md)** — Tailwind CSS 3
9. **[06-react-router.md](06-react-router.md)** — React Router 6
10. **[08-component-architecture.md](08-component-architecture.md)** — Компонентная архитектура
11. **[09-data-flow.md](09-data-flow.md)** — Data Flow паттерны
12. **[10-dark-themes.md](10-dark-themes.md)** — Тёмные темы
13. **[11-mobile-first.md](11-mobile-first.md)** — Mobile-First дизайн
14. **[12-design-systems.md](12-design-systems.md)** — Дизайн-системы
15. **[15-pwa-performance.md](15-pwa-performance.md)** — Оптимизация PWA
16. **[16-performance-metrics.md](16-performance-metrics.md)** — Метрики производительности
17. **[21-vercel.md](21-vercel.md)** — Vercel (деплой и Serverless Functions)
18. **[28-supabase-frontend.md](28-supabase-frontend.md)** — Supabase для фронтенда

### Низкий приоритет

19. **[13-animations.md](13-animations.md)** — Анимации и переходы
20. **[17-recipe-management.md](17-recipe-management.md)** — Управление рецептами
21. **[18-menu-planning.md](18-menu-planning.md)** — Планирование меню
22. **[19-freezer-tracker.md](19-freezer-tracker.md)** — Трекер морозилки
23. **[20-checklists-timers.md](20-checklists-timers.md)** — Чек-листы и таймеры
24. **[22-github-pages.md](22-github-pages.md)** — GitHub Pages
25. **[23-cicd.md](23-cicd.md)** — CI/CD
26. **[24-react-testing.md](24-react-testing.md)** — Тестирование React приложений
27. **[25-pwa-testing.md](25-pwa-testing.md)** — Тестирование PWA
28. **[26-web-security.md](26-web-security.md)** — Безопасность веб-приложений
29. **[27-pwa-security.md](27-pwa-security.md)** — Безопасность PWA

## Использование

1. Откройте NotebookLM
2. Создайте новый блокнот или используйте существующий
3. Скопируйте содержимое нужного промпта в контекстное окно
4. NotebookLM начнёт поиск материалов по указанной теме
5. Используйте найденные материалы для изучения и генерации подкастов

## Архитектура проекта

- **Деплой:** Vercel (https://semeyno-yeda.vercel.app/)
- **Основная БД:** Neon PostgreSQL (через Vercel Serverless Functions API)
- **Локальный кэш:** IndexedDB (Dexie.js) для offline-first синхронизации
- **Фронтенд:** Supabase используется только для клиентских сервисов (не для БД)

## Примечания

- Каждый промпт самодостаточен и содержит весь необходимый контекст
- Промпты оптимизированы для размера контекстного окна (~30 строк)
- Приоритеты указаны для планирования изучения материалов
- Все промпты следуют единому формату для удобства использования

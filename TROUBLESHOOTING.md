# Troubleshooting Guide — Решение проблем

## Ошибки 500 в API endpoints

### Симптомы
- `Failed to load resource: the server responded with a status of 500`
- Ошибки при загрузке `/api/data/recipes`, `/api/data/menus`, `/api/data/chef-settings`, `/api/data/freezer`

### Причины и решения

#### 1. DATABASE_URL не установлена в Vercel

**Проверка:**
1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект → **Settings** → **Environment Variables**
3. Проверьте наличие переменной `DATABASE_URL`

**Решение:**
1. Добавьте переменную `DATABASE_URL` со значением:
   ```
   postgresql://neondb_owner:npg_mvu3wA6dSDaU@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
2. Выберите все окружения (Production, Preview, Development)
3. Сохраните и **обязательно перезапустите деплоймент** (Redeploy)

#### 2. Проверка логов Vercel

1. Откройте проект в Vercel Dashboard
2. Перейдите в **Deployments** → выберите последний деплоймент
3. Откройте вкладку **Logs** или **Runtime Logs**
4. Ищите сообщения с префиксом `[db]` или `[api/data/...]`

**Ожидаемые сообщения при отсутствии DATABASE_URL:**
```
[db] Error: DATABASE_URL environment variable is not set
[db] Available env vars: []
```

#### 3. Проверка подключения к базе данных

Локально можно проверить подключение:
```bash
npm run test:db
```

Если локально работает, но на Vercel нет — проблема в переменных окружения.

---

## Ошибка 401 для manifest.webmanifest

### Симптомы
- `Manifest fetch from .../manifest.webmanifest failed, code 401`
- `Failed to load resource: the server responded with a status of 401`

### Причины и решения

#### 1. Проблема с доступом к статическим файлам

**Решение:**
1. Проверьте файл `vercel.json` — убедитесь, что нет ограничений доступа
2. Убедитесь, что `manifest.webmanifest` находится в папке `public/`
3. Проверьте настройки Vercel → **Settings** → **General** → нет ли ограничений доступа

#### 2. Проблема с PWA конфигурацией

**Проверка:**
- Откройте DevTools → Network
- Проверьте URL запроса к manifest
- Убедитесь, что URL правильный (без лишних параметров)

**Временное решение:**
Ошибка 401 для manifest не критична — PWA будет работать, но без некоторых функций манифеста.

---

## Ошибка "non-precached-url" в Service Worker

### Симптомы
- `Uncaught (in promise) non-precached-url: non-precached-url :: [{"url":"index.html"}]`

### Причина
Service Worker пытается обработать URL, который не был предзакэширован.

### Решение
Это предупреждение, не критичная ошибка. Service Worker автоматически обработает запрос через сеть.

Если хотите убрать предупреждение:
1. Проверьте конфигурацию Workbox в `vite.config.ts`
2. Убедитесь, что `globPatterns` включает все необходимые файлы

---

## Диагностика проблем

### Шаг 1: Проверка переменных окружения

В Vercel Dashboard → **Settings** → **Environment Variables** должны быть:
- `DATABASE_URL` — обязательно для API endpoints

### Шаг 2: Проверка логов

1. Vercel Dashboard → **Deployments** → последний деплоймент
2. **Runtime Logs** — проверьте ошибки при выполнении API запросов
3. Ищите сообщения с префиксами:
   - `[db]` — ошибки подключения к БД
   - `[api/data/...]` — ошибки в API handlers
   - `[recipeRepo]`, `[menuRepo]`, etc. — ошибки в репозиториях

### Шаг 3: Проверка деплоя

1. Убедитесь, что последний коммит задеплоен
2. Проверьте статус деплоймента (должен быть "Ready")
3. Если есть ошибки сборки — проверьте **Build Logs**

### Шаг 4: Тестирование локально

```bash
# Проверка подключения к БД
npm run test:db

# Запуск локального сервера
npm run dev
```

Если локально работает, но на Vercel нет — проблема в конфигурации Vercel.

---

## Частые проблемы

### Проблема: API возвращает 500, но локально работает

**Решение:**
1. Проверьте переменные окружения в Vercel
2. Убедитесь, что перезапустили деплоймент после добавления переменных
3. Проверьте Runtime Logs для деталей ошибки

### Проблема: "DATABASE_URL environment variable is not set"

**Решение:**
1. Добавьте `DATABASE_URL` в Vercel Environment Variables
2. Выберите все окружения (Production, Preview, Development)
3. **Обязательно перезапустите деплоймент**

### Проблема: Подключение к БД работает локально, но не на Vercel

**Решение:**
1. Проверьте формат `DATABASE_URL` в Vercel (должен быть полный connection string)
2. Убедитесь, что нет лишних пробелов или кавычек
3. Проверьте, что переменная доступна для всех окружений

---

## Полезные команды

```bash
# Тест подключения к БД
npm run test:db

# Миграция данных в БД
npm run seed:neon

# Проверка статуса Git
git status

# Просмотр последних коммитов
git log --oneline -5
```

---

## Контакты и ресурсы

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Console](https://console.neon.tech/)
- [Vercel Runtime Logs Documentation](https://vercel.com/docs/monitoring/logs)

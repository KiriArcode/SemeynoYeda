> **УСТАРЕЛО**: Этот документ описывает деплой на GitHub Pages. Проект перенесён на **Vercel**. Актуальные инструкции — в [README.md](README.md) и [SPEC.md](SPEC.md).

# Уроки деплоя Vite + React Router на GitHub Pages

Документ с выученными уроками при деплое Vite приложения с React Router на GitHub Pages. Содержит проблемы, которые возникали, и их решения.

**Проект:** `SemeynoYeda`  
**URL:** `https://<USERNAME>.github.io/SemeynoYeda/`

## Технологический стек

- **Vite 5** (сборщик и dev-сервер)
- **React 18** (функциональные компоненты)
- **TypeScript 5** (strict mode)
- **React Router 6** (клиентская маршрутизация)
- **Tailwind CSS 3** (стилизация)
- **Dexie.js** (IndexedDB для offline данных)
- **GitHub Pages** (Project Pages)

---

## Проблема 1: GitHub Pages 404 Error и Redirect Loop

### Симптомы

- Сайт показывает 404 ошибку на GitHub Pages
- Бесконечный редирект на `/SemeynoYeda/`
- Страницы не загружаются, статические файлы не находятся
- Клиентские маршруты (например, `/recipes`) возвращают 404

### Причина

**Неправильное понимание структуры GitHub Project Pages:**

1. GitHub Project Pages обслуживает сайт из корня репозитория или из папки `docs/`
2. При использовании `base: '/SemeynoYeda/'` в Vite, все пути уже содержат этот префикс
3. Не нужно перемещать файлы из `dist/` в `dist/SemeynoYeda/` — это создавало двойной путь
4. React Router требует правильного `basename` для работы с GitHub Pages
5. GitHub Pages не знает о клиентских маршрутах — нужен fallback через `404.html`

### Решение

**1. Конфигурация `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/SemeynoYeda/',  // Префикс для всех путей и статических файлов
  plugins: [
    react(),
    tailwindcss(),
  ],
});
```

**Ключевые моменты:**

- ✅ `base` должен заканчиваться на `/` (например, `/SemeynoYeda/`)
- ✅ `base` должен соответствовать имени репозитория
- ✅ Vite автоматически добавляет этот префикс ко всем путям в HTML

**2. Конфигурация React Router (`src/app/Router.tsx`):**

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Определяем basename в зависимости от окружения
const getBasename = () => {
  // В production на GitHub Pages путь содержит '/SemeynoYeda'
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/SemeynoYeda')) {
    return '/SemeynoYeda';
  }
  // В dev режиме basename пустой
  const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';
  return isProd ? '/SemeynoYeda' : '';
};

const basename = getBasename();

const router = createBrowserRouter([
  // маршруты...
], {
  basename,  // Важно: basename без trailing slash
});
```

**Ключевые моменты:**

- ✅ `basename` в Router должен быть БЕЗ trailing slash (`/SemeynoYeda`, не `/SemeynoYeda/`)
- ✅ `basename` должен совпадать с `base` из vite.config.ts (без trailing slash)
- ✅ В dev режиме `basename` должен быть пустым для локальной разработки

**3. GitHub Pages Fallback (`public/404.html`):**

Для поддержки клиентской маршрутизации (SPA) нужен fallback файл:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SemeynoYeda — Семейная еда</title>
    <script>
      // GitHub Pages fallback для SPA
      // Редиректим все 404 на index.html с сохранением пути
      var path = window.location.pathname;
      var search = window.location.search;
      var hash = window.location.hash;
      
      var basePath = '/SemeynoYeda';
      var targetPath = path;
      
      if (!path.startsWith(basePath)) {
        targetPath = basePath + path;
      }
      
      // Убираем trailing slash если есть (кроме корня)
      if (targetPath !== basePath + '/' && targetPath.endsWith('/')) {
        targetPath = targetPath.slice(0, -1);
      }
      
      // Редиректим на index.html с сохранением пути
      var redirectUrl = basePath + '/index.html' + 
        (targetPath !== basePath + '/index.html' ? '#' + targetPath.replace(basePath, '') : '') + 
        search + hash;
      window.location.replace(redirectUrl);
    </script>
  </head>
  <body>
    <div id="root">
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
        <p>Загрузка...</p>
      </div>
    </div>
  </body>
</html>
```

**4. GitHub Actions workflow (`.github/workflows/deploy.yml`):**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Clean and build
        run: |
          rm -rf dist  # Очистка перед сборкой
          npm run build
      - name: Verify build output structure
        continue-on-error: true
        run: |
          echo "=== Build output structure ==="
          ls -la dist/ 2>&1 | head -20
          echo ""
          echo "=== HTML files and assets ==="
          test -f dist/index.html && echo "✓ dist/index.html exists" || echo "✗ dist/index.html missing"
          test -d dist/assets && echo "✓ dist/assets exists" || echo "⚠ dist/assets not found"
          echo "Total files: $(find dist -type f 2>/dev/null | wc -l)"
      - name: Verify structure before upload
        run: |
          set -e
          if [ ! -f "dist/index.html" ]; then echo "✗ dist/index.html missing"; exit 1; fi
          if [ ! -d "dist/assets" ]; then echo "✗ dist/assets/ missing"; exit 1; fi
          echo "✓ dist/index.html exists"
          echo "✓ dist/assets/ exists"
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist  # Загружаем dist/ напрямую, БЕЗ перемещения

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    permissions:
      pages: write
      id-token: write
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Ключевые моменты:**

- ✅ Загружаем `dist/` напрямую как артефакт
- ❌ НЕ перемещаем файлы из `dist/` в `dist/SemeynoYeda/`
- ❌ НЕ создаем дополнительных редиректов
- ✅ Vite с `base` уже генерирует правильные пути в HTML
- ✅ `404.html` должен быть в `public/` и будет скопирован в `dist/`

**5. Настройка GitHub Pages:**

В настройках репозитория (`Settings > Pages`):

- Source: **GitHub Actions** (не `Deploy from a branch`)
- Это позволяет использовать workflow для деплоя

### Результат

Сайт доступен по адресу: `https://<USERNAME>.github.io/SemeynoYeda/`

Все пути и статические файлы корректно разрешаются с префиксом `/SemeynoYeda`. Клиентские маршруты работают через `404.html` fallback.

---

## Проблема 2: Навигация не работает (карточки не кликабельны)

### Симптомы

- Карточки рецептов не реагируют на клики
- Навигация через `useNavigate()` не работает
- Элементы нижней навигации не переключают страницы

### Причина

1. Использование `div` с `onClick` вместо `Link` компонента из React Router
2. `preventDefault()` может блокировать навигацию
3. Неправильный `basename` в Router может ломать пути

### Решение

**Использовать `Link` компоненты вместо `div` с `onClick`:**

**До (неправильно):**

```tsx
<div onClick={() => navigate(`/recipe/${recipe.id}`)}>
  {/* содержимое карточки */}
</div>
```

**После (правильно):**

```tsx
import { Link } from 'react-router-dom';

<Link to={`/recipe/${recipe.id}`} className="block">
  {/* содержимое карточки */}
</Link>
```

**Преимущества `Link`:**

- ✅ Правильная обработка `basename`
- ✅ Поддержка модификаторов клавиатуры (Ctrl+Click для новой вкладки)
- ✅ Правильная история браузера
- ✅ Работает даже если JavaScript еще не загрузился

**Для нижней навигации:**

```tsx
import { Link, useLocation } from 'react-router-dom';

<Link
  to="/recipes"
  className={location.pathname === '/recipes' ? 'active' : ''}
>
  Рецепты
</Link>
```

### Результат

Навигация работает корректно. Карточки и ссылки кликабельны, переходы между страницами происходят без перезагрузки.

---

## Проблема 3: Basename определяется неправильно

### Симптомы

- В dev режиме пути содержат `/SemeynoYeda`, хотя не должны
- В production пути не содержат `/SemeynoYeda`, хотя должны
- Навигация работает локально, но не работает на GitHub Pages

### Причина

Неправильное определение окружения (dev vs production) при инициализации Router.

### Решение

**Надежное определение basename:**

```typescript
// src/app/Router.tsx
const getBasename = () => {
  // Сначала проверяем window.location (работает и в dev, и в prod)
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    // Если путь уже содержит префикс, используем его
    if (pathname.startsWith('/SemeynoYeda')) {
      return '/SemeynoYeda';
    }
  }
  // Иначе используем env переменную Vite
  const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';
  return isProd ? '/SemeynoYeda' : '';
};

const basename = getBasename();
```

**Альтернативный подход (более простой):**

Если вы всегда запускаете dev сервер локально (не на GitHub Pages), можно упростить:

```typescript
const basename = import.meta.env.PROD ? '/SemeynoYeda' : '';
```

Но первый подход более надежен, так как проверяет фактический URL.

### Результат

Basename определяется корректно в обоих окружениях. Навигация работает и локально, и на GitHub Pages.

---

## Проблема 4: Статические файлы не загружаются

### Симптомы

- CSS и JS файлы возвращают 404
- Изображения не отображаются
- Консоль показывает ошибки загрузки ресурсов

### Причина

1. Неправильный `base` в `vite.config.ts`
2. Статические файлы не копируются в `dist/`
3. Пути к статическим файлам не содержат префикс `/SemeynoYeda/`

### Решение

**1. Проверка `vite.config.ts`:**

```typescript
export default defineConfig({
  base: '/SemeynoYeda/',  // Должен заканчиваться на /
  // ...
});
```

**2. Проверка структуры `dist/` после сборки:**

```bash
npm run build
ls -la dist/
```

Должна быть структура:

```
dist/
  index.html
  assets/
    index-xxxxx.js
    index-xxxxx.css
  404.html
```

**3. Проверка путей в `dist/index.html`:**

```bash
grep -r "/SemeynoYeda" dist/index.html
```

Все пути к статическим файлам должны начинаться с `/SemeynoYeda/assets/...`

**4. Если пути неправильные:**

- Убедитесь, что `base` в `vite.config.ts` заканчивается на `/`
- Пересоберите проект: `rm -rf dist && npm run build`
- Проверьте, что в HTML правильные пути

### Результат

Все статические файлы загружаются корректно. CSS, JS и изображения доступны по правильным путям.

---

## Проблема 5: GitHub Actions деплой не работает

### Симптомы

- Workflow запускается, но деплой не происходит
- Ошибка: `HttpError: Not Found` или `Failed to create deployment`
- Environment `github-pages` не найден

### Причина

GitHub Pages не включен в настройках репозитория или неправильно настроен.

### Решение

**1. Включить GitHub Pages:**

1. Откройте `https://github.com/<USERNAME>/SemeynoYeda/settings/pages`
2. В разделе "Build and deployment":
   - Выберите **Source** → **GitHub Actions**
   - Нажмите **Save**

**2. Проверить Environment:**

После включения GitHub Pages автоматически создастся environment `github-pages`.

Если environment не появился:

1. Перейдите в **Settings** → **Environments**
2. Нажмите **New environment**
3. Введите имя: `github-pages`
4. Сохраните (не нужно добавлять переменные)

**3. Проверить Workflow:**

Убедитесь, что workflow файл находится по пути:

```
.github/workflows/deploy.yml
```

И содержит правильные permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**4. Перезапустить деплой:**

После включения GitHub Pages:

- Сделайте небольшое изменение и запушьте
- Или перезапустите последний workflow через Actions → Re-run

### Результат

Деплой работает автоматически при каждом push в `main`. Сайт доступен по адресу `https://<USERNAME>.github.io/SemeynoYeda/`.

---

## Проблема 6: Перезагрузка страниц возвращает 404

### Симптомы

- При перезагрузке клиентского маршрута (например, `/recipes` или `/recipe/:id`) показывается 404 ошибка
- Страница не загружается после перезагрузки
- Прямые переходы по ссылкам работают, но перезагрузка (F5) ломает навигацию

### Причина

**GitHub Pages не знает о клиентских маршрутах:**

1. Когда пользователь перезагружает страницу `/SemeynoYeda/recipes`, GitHub Pages ищет файл по этому пути
2. Такого файла не существует (это клиентский маршрут React Router)
3. GitHub Pages возвращает 404 и показывает `404.html`
4. Простой редирект на `index.html` теряет информацию об оригинальном пути
5. React Router не может определить правильный маршрут после редиректа

### Решение

**1. GitHub Pages Fallback (`public/404.html`):**

Файл должен сохранять оригинальный путь перед редиректом:

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SemeynoYeda — Семейная еда</title>
    <script>
      // GitHub Pages fallback для SPA
      // Сохраняем оригинальный путь перед редиректом на index.html
      var path = window.location.pathname;
      var search = window.location.search;
      var hash = window.location.hash;
      
      var basePath = '/SemeynoYeda';
      
      // Сохраняем оригинальный путь в sessionStorage для восстановления после редиректа
      // Это нужно потому что после редиректа на index.html путь изменится
      if (path !== basePath + '/index.html' && path !== basePath + '/') {
        sessionStorage.setItem('404-redirect-path', path + search + hash);
      }
      
      // Редиректим на index.html
      // React Router восстановит путь из sessionStorage или использует текущий путь
      var redirectUrl = basePath + '/index.html';
      window.location.replace(redirectUrl);
    </script>
  </head>
  <body>
    <div id="root">
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
        <p>Загрузка...</p>
      </div>
    </div>
  </body>
</html>
```

**2. Восстановление пути в `src/main.tsx`:**

Путь должен быть восстановлен ДО инициализации React Router:

```typescript
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
```

**Ключевые моменты:**

- ✅ `404.html` сохраняет путь в `sessionStorage` перед редиректом
- ✅ `main.tsx` восстанавливает путь ДО инициализации Router
- ✅ Используется `window.history.replaceState` для восстановления URL
- ✅ `sessionStorage` очищается после использования

**3. Как это работает:**

1. Пользователь перезагружает `/SemeynoYeda/recipes`
2. GitHub Pages показывает `404.html`
3. `404.html` сохраняет `/SemeynoYeda/recipes` в `sessionStorage` и редиректит на `/SemeynoYeda/index.html`
4. `main.tsx` восстанавливает путь из `sessionStorage` через `history.replaceState`
5. React Router инициализируется с правильным путем и показывает страницу рецептов

### Результат

Перезагрузка любых клиентских маршрутов работает корректно. Пользователь может перезагружать страницы без потери навигации. Все маршруты доступны как при прямом переходе, так и при перезагрузке.

---

## Чеклист для проекта SemeynoYeda

### 1. Конфигурация Vite (`vite.config.ts`)

- [x] `base: '/SemeynoYeda/'` соответствует имени репозитория (с trailing slash)
- [x] Плагины настроены (react, tailwindcss)
- [x] PWA плагин закомментирован до настройки иконок

### 2. Конфигурация React Router (`src/app/Router.tsx`)

- [x] `basename` определяется динамически (dev vs prod)
- [x] `basename` БЕЗ trailing slash (`/SemeynoYeda`, не `/SemeynoYeda/`)
- [x] `basename` совпадает с `base` из vite.config.ts (без trailing slash)
- [x] Все маршруты определены правильно

### 3. GitHub Pages Fallback (`public/404.html`)

- [x] Файл существует в `public/404.html`
- [x] Содержит редирект на `index.html` с сохранением пути в sessionStorage
- [x] Использует правильный `basePath: '/SemeynoYeda'`
- [x] Сохраняет оригинальный путь перед редиректом

### 4. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

- [x] Правильные permissions: `contents: read`, `pages: write`, `id-token: write`
- [x] Очистка `dist` перед сборкой (`rm -rf dist`)
- [x] Проверка структуры `dist/` перед загрузкой артефакта
- [x] Загрузка `dist` напрямую, без перемещения файлов
- [x] Environment: `github-pages`

### 5. Навигация и компоненты

- [x] Используются `Link` компоненты вместо `div` с `onClick`
- [x] Карточки рецептов кликабельны
- [x] Нижняя навигация работает
- [x] Все пути используют относительные маршруты (без `/SemeynoYeda` в `to` prop)

### 6. Восстановление пути при перезагрузке (`src/main.tsx`)

- [x] Восстановление пути из sessionStorage ДО инициализации Router
- [x] Использование `window.history.replaceState` для восстановления URL
- [x] Очистка sessionStorage после использования

### 7. Тестирование

- [ ] Локальная сборка: `npm run build`
- [ ] Проверка структуры `dist/` после сборки
- [ ] Проверка наличия `dist/index.html` и `dist/assets/`
- [ ] Проверка путей к статическим файлам в `dist/index.html`
- [ ] Проверка наличия `dist/404.html` с правильным содержимым
- [ ] Локальный preview: `npm run preview` (с `base` в vite.config.ts)
- [ ] Проверка после деплоя на GitHub Pages: `https://<USERNAME>.github.io/SemeynoYeda/`
- [ ] Проверка всех страниц и навигации
- [ ] Проверка клиентских маршрутов (например, `/recipes`, `/recipe/:id`)
- [ ] **Проверка перезагрузки страниц:** перезагрузите каждую страницу (F5) и убедитесь, что она загружается корректно:
  - [ ] Перезагрузка `/recipes` работает
  - [ ] Перезагрузка `/recipe/:id` работает
  - [ ] Перезагрузка `/freezer` работает
  - [ ] Перезагрузка `/shopping` работает
  - [ ] Перезагрузка `/prep` работает
  - [ ] Перезагрузка `/cooking` работает
- [ ] Проверка работы sessionStorage fallback в DevTools (Application → Session Storage)

---

## Полезные команды для проекта SemeynoYeda

```bash
# Локальная разработка
npm run dev

# Сборка для проверки
npm run build

# Просмотр собранного проекта локально
npm run preview

# Просмотр структуры dist/ (из корня проекта)
ls -la dist/
find dist -type f | head -20

# Проверка размера сборки
du -sh dist/

# Проверка HTML файлов на наличие basePath
grep -r "/SemeynoYeda" dist/index.html | head -5

# Проверка структуры статических файлов
ls -la dist/assets/

# Проверка конфигурации Vite
cat vite.config.ts

# Проверка конфигурации Router
grep -A 5 "basename" src/app/Router.tsx

# Очистка перед сборкой (как в workflow)
rm -rf dist
npm run build

# Проверка путей в собранном HTML
cat dist/index.html | grep -o 'src="[^"]*"' | head -10
cat dist/index.html | grep -o 'href="[^"]*"' | head -10
```

---

## Дополнительные ресурсы

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router Basename](https://reactrouter.com/en/main/routers/create-browser-router#basename)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Base Option](https://vitejs.dev/config/shared-options.html#base)

---

## Заключение

Основные принципы успешного деплоя Vite + React Router на GitHub Pages:

1. **Правильная конфигурация `base`** — должен заканчиваться на `/` и соответствовать имени репозитория
2. **Правильный `basename` в Router** — БЕЗ trailing slash, определяется динамически
3. **Fallback для SPA** — `404.html` для поддержки клиентской маршрутизации
4. **Использование `Link` компонентов** — вместо `div` с `onClick` для надежной навигации
5. **Тестирование структуры** — проверяйте `dist/` после сборки
6. **Использование GitHub Actions** — более надежно, чем деплой из ветки

Удачи с деплоем!

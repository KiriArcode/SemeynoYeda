# 🛠️ SemeynoYeda — Инструкция по сборке

## Быстрый старт

### 1. Создание проекта

```bash
# Создать Vite проект
npm create vite@latest SemeynoYeda -- --template react-ts
cd SemeynoYeda

# Установить зависимости
npm install

# Core
npm install react-router-dom dexie dexie-react-hooks nanoid

# UI
npm install lucide-react

# PWA
npm install -D vite-plugin-pwa

# Tailwind
npm install -D tailwindcss @tailwindcss/vite
```

### 2. Структура папок

```bash
# Создать все директории
mkdir -p src/{app,components/{ui,layout,recipe,menu,prep,shopping},data/{recipes,menu,inventory},hooks,lib,styles}
mkdir -p public/icons
mkdir -p data/{inbox,processed}
mkdir -p scripts
mkdir -p .cursor/rules
```

### 3. Конфигурация

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/SemeynoYeda/',  // ← имя репозитория на GitHub (с заглавными буквами)
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'SemeynoYeda — Семейная еда',
        short_name: 'СемейноЕда',
        description: 'Планировщик семейного питания',
        theme_color: '#39FF14',
        background_color: '#0B0E14',
        display: 'standalone',
        start_url: '/SemeynoYeda/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
});
```

#### src/styles/globals.css
```css
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@theme {
  /* Core — фоны и поверхности */
  --color-void: #0B0E14;
  --color-dimension: #141821;
  --color-rift: #1C2230;
  --color-nebula: #252D3B;

  /* Portal — акценты и интерактив */
  --color-portal: #39FF14;
  --color-portal-dim: #2BD911;
  --color-portal-glow: rgba(57, 255, 20, 0.15);
  --color-portal-mist: rgba(57, 255, 20, 0.06);

  /* Food — еда и контент */
  --color-ramen: #FFB347;
  --color-miso: #E8985A;
  --color-matcha: #8DB580;
  --color-sakura: #FFB7C5;
  --color-frost: #8DB5E0;
  --color-plasma: #B197FC;

  /* Text — иерархия */
  --color-text-light: #F0EDE8;
  --color-text-mid: #9BA3B2;
  --color-text-dim: #5A6270;
  --color-text-ghost: #3A4150;

  /* Family — кто ест */
  --color-kolya: #39FF14;
  --color-kristina: #FFB347;
  --color-both: #B197FC;

  /* Шрифты */
  --font-heading: 'Chakra Petch', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Пространство */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;

  /* Скругления */
  --radius-button: 10px;
  --radius-card: 16px;
  --radius-modal: 20px;
  --radius-pill: 9999px;

  /* Тени */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 4px 16px rgba(57, 255, 20, 0.15);
  --shadow-elevate: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-nav: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

:root {
  /* Core — фоны и поверхности */
  --void: #0B0E14;
  --dimension: #141821;
  --rift: #1C2230;
  --nebula: #252D3B;

  /* Portal — акценты и интерактив */
  --portal: #39FF14;
  --portal-dim: #2BD911;
  --portal-glow: rgba(57, 255, 20, 0.15);
  --portal-mist: rgba(57, 255, 20, 0.06);

  /* Food — еда и контент */
  --ramen: #FFB347;
  --miso: #E8985A;
  --matcha: #8DB580;
  --sakura: #FFB7C5;
  --frost: #8DB5E0;
  --plasma: #B197FC;

  /* Text — иерархия */
  --text-light: #F0EDE8;
  --text-mid: #9BA3B2;
  --text-dim: #5A6270;
  --text-ghost: #3A4150;

  /* Family — кто ест */
  --kolya: #39FF14;
  --kristina: #FFB347;
  --both: #B197FC;

  /* Шрифты */
  --font-heading: 'Chakra Petch', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Пространство */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;

  /* Скругления */
  --radius-button: 10px;
  --radius-card: 16px;
  --radius-modal: 20px;
  --radius-pill: 9999px;

  /* Тени */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 4px 16px rgba(57, 255, 20, 0.15);
  --shadow-elevate: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-nav: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

/* Анимации */
@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes portalPulse {
  0%, 100% {
    box-shadow: 0 0 16px rgba(57, 255, 20, 0.2);
  }
  50% {
    box-shadow: 0 0 24px rgba(57, 255, 20, 0.35);
  }
}

/* Базовые стили */
body {
  font-family: var(--font-body);
  color: var(--text-light);
  background: var(--void);
  -webkit-font-smoothing: antialiased;
  margin: 0;
  padding: 0;
}

/* Scroll snap для недельного меню */
.week-scroll {
  scroll-snap-type: x mandatory;
}

.day-column {
  scroll-snap-align: start;
}

/* Скроллбар */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--void);
}

::-webkit-scrollbar-thumb {
  background: var(--nebula);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--portal);
}
```

### 4. Инициализация базы данных

#### src/lib/db.ts
```typescript
import Dexie, { type EntityTable } from 'dexie';
import type { Recipe, WeekMenu, FreezerItem, ShoppingItem } from '../data/schema';

const db = new Dexie('SemeynoYedaDB') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>;
  menus: EntityTable<WeekMenu, 'id'>;
  freezer: EntityTable<FreezerItem, 'id'>;
  shopping: EntityTable<ShoppingItem, 'ingredient'>;
};

db.version(1).stores({
  recipes: 'id, slug, category, *tags, suitableFor',
  menus: 'id, weekStart',
  freezer: 'id, recipeId, expiryDate',
  shopping: 'ingredient, category, checked',
});

export { db };
```

### 5. Начальные данные

#### src/data/recipes/sauces.json (пример)
```json
[
  {
    "id": "sauce_001",
    "slug": "kabachkovyj-sous",
    "title": "Кабачковый соус",
    "subtitle": "база для Коли",
    "category": "sauce",
    "tags": ["gastritis-safe", "freezable", "quick"],
    "suitableFor": "kolya",
    "prepTime": 5,
    "cookTime": 15,
    "totalTime": 20,
    "servings": 6,
    "ingredients": [
      { "name": "кабачок", "amount": 300, "unit": "г" },
      { "name": "картофель", "amount": 100, "unit": "г" },
      { "name": "оливковое масло", "amount": 1, "unit": "ст.л." },
      { "name": "вода", "amount": 100, "unit": "мл" }
    ],
    "steps": [
      {
        "order": 1,
        "text": "Кабачок и картофель нарезать кубиками",
        "duration": 5
      },
      {
        "order": 2,
        "text": "Отварить в воде до мягкости",
        "equipment": { "id": "stove", "label": "Газовая плита", "settings": "средний огонь", "duration": 12 },
        "duration": 12,
        "parallel": true,
        "tip": "Пока варится — можно формовать котлеты"
      },
      {
        "order": 3,
        "text": "Пробить блендером до гладкости",
        "equipment": { "id": "blender", "label": "Блендер", "settings": "насадка для пюре" },
        "duration": 2
      },
      {
        "order": 4,
        "text": "Добавить оливковое масло, перемешать. Разлить по порциям",
        "duration": 1
      }
    ],
    "equipment": ["stove", "blender"],
    "storage": { "fridge": 4, "freezer": 3, "vacuumSealed": false },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

#### src/data/recipes/mains.json (пример заготовки)
```json
[
  {
    "id": "main_001",
    "slug": "svino-govyazhie-kotlety",
    "title": "Свино-говяжьи котлеты",
    "subtitle": "заготовка на 3 месяца",
    "category": "main",
    "tags": ["freezable", "soft-texture", "prep-day"],
    "suitableFor": "both",
    "prepTime": 30,
    "cookTime": 15,
    "totalTime": 45,
    "servings": 20,
    "ingredients": [
      { "name": "говядина", "amount": 1, "unit": "кг" },
      { "name": "свинина (лопатка)", "amount": 500, "unit": "г" },
      { "name": "лук", "amount": 2, "unit": "шт", "note": "отварить!" },
      { "name": "соль", "amount": 1, "unit": "по вкусу" }
    ],
    "steps": [
      {
        "order": 1,
        "text": "Лук отварить до мягкости (чтобы не раздражал желудок)",
        "equipment": { "id": "stove", "label": "Газовая плита", "settings": "средний огонь", "duration": 10 },
        "duration": 10,
        "parallel": true,
        "tip": "Пока варится лук — нарезать мясо кусками для гриндера"
      },
      {
        "order": 2,
        "text": "Мясо нарезать кусками, пропустить через гриндер вместе с варёным луком",
        "equipment": { "id": "grinder", "label": "Гриндер" },
        "duration": 10
      },
      {
        "order": 3,
        "text": "Загрузить фарш в миксер, вымесить до однородности. Посолить",
        "equipment": { "id": "mixer", "label": "Планетарный миксер", "settings": "насадка для теста, скорость 2" },
        "duration": 5,
        "tip": "Миксер вымешивает лучше рук — котлеты будут нежнее"
      },
      {
        "order": 4,
        "text": "Сформировать котлеты (~80г каждая), выложить на доску/поднос",
        "equipment": { "id": "bowls", "label": "Миска большая" },
        "duration": 15
      },
      {
        "order": 5,
        "text": "Разложить по пакетам (4-6 шт), убрать воздух вакууматором",
        "equipment": { "id": "vacuum", "label": "Вакууматор" },
        "duration": 10,
        "tip": "Вакуум = нет морозильного ожога, хранится дольше"
      },
      {
        "order": 6,
        "text": "Заморозить. Подписать дату и содержимое",
        "duration": 2
      }
    ],
    "equipment": ["stove", "grinder", "mixer", "bowls", "vacuum"],
    "notes": "Готовить: Коля — пароварка (25 мин) или аэрогриль (180°C, 20 мин). Кристина — электрогриль (7 мин на сторону) или духовка (200°C, 25 мин)",
    "storage": { "fridge": 2, "freezer": 3, "vacuumSealed": true },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "main_002",
    "slug": "rybnoe-sufle",
    "title": "Рыбное суфле",
    "subtitle": "нежное, для обоих",
    "category": "main",
    "tags": ["gastritis-safe", "soft-texture", "freezable", "prep-day"],
    "suitableFor": "both",
    "prepTime": 15,
    "cookTime": 35,
    "totalTime": 50,
    "servings": 8,
    "ingredients": [
      { "name": "рыба (треска/минтай)", "amount": 800, "unit": "г" },
      { "name": "яйцо", "amount": 2, "unit": "шт" },
      { "name": "молоко", "amount": 100, "unit": "мл" },
      { "name": "соль", "amount": 1, "unit": "по вкусу" }
    ],
    "steps": [
      {
        "order": 1,
        "text": "Рыбу пропустить через гриндер 2 раза для нежной текстуры",
        "equipment": { "id": "grinder", "label": "Гриндер" },
        "duration": 5
      },
      {
        "order": 2,
        "text": "Добавить желтки, молоко, соль — пробить блендером до кремовой массы",
        "equipment": { "id": "blender", "label": "Блендер" },
        "duration": 3
      },
      {
        "order": 3,
        "text": "Белки взбить миксером в крепкую пену, аккуратно вмешать в массу",
        "equipment": { "id": "mixer", "label": "Планетарный миксер", "settings": "венчик, максимальная скорость" },
        "duration": 5
      },
      {
        "order": 4,
        "text": "Разложить по формам (силиконовые порционные). Запечь или приготовить на пару",
        "equipment": { "id": "oven", "label": "Духовка", "settings": "170°C, с водяной баней", "duration": 30 },
        "duration": 30,
        "parallel": true,
        "tip": "Вариант для Коли: пароварка 25 мин — ещё нежнее"
      },
      {
        "order": 5,
        "text": "Остудить, вакуумировать порционно, заморозить",
        "equipment": { "id": "vacuum", "label": "Вакууматор" },
        "duration": 10
      }
    ],
    "equipment": ["grinder", "blender", "mixer", "oven", "vacuum"],
    "notes": "Разогрев: пароварка 10 мин (лучше для Коли) или духовка 170°C 15 мин",
    "storage": { "fridge": 2, "freezer": 2, "vacuumSealed": true },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

#### src/data/equipment.json (справочник оборудования)
```json
[
  {
    "id": "stove",
    "name": "Газовая плита",
    "emoji": "🔥",
    "bestFor": ["варка пюре", "соусы", "крупы", "бульоны"],
    "dietNote": "Универсальная — подходит обоим",
    "tips": "Средний огонь для соусов, слабый для круп"
  },
  {
    "id": "oven",
    "name": "Духовка",
    "emoji": "🫕",
    "bestFor": ["суфле", "запеканки", "котлеты", "овощи"],
    "dietNote": "Для Коли: с водяной баней (мягче). Для Кристины: без бани (корочка)",
    "tips": "Предварительный разогрев 10 мин. Суфле — 170°C, котлеты — 190-200°C"
  },
  {
    "id": "air-grill",
    "name": "Аэрогриль",
    "emoji": "🌀",
    "bestFor": ["котлеты без масла", "овощи", "рыба"],
    "dietNote": "Отлично для Коли — без масла, без жарки, но с лёгкой корочкой",
    "tips": "Котлеты 180°C 18-20 мин, овощи 190°C 15 мин. Не пересушивать"
  },
  {
    "id": "e-grill",
    "name": "Электрогриль",
    "emoji": "🥩",
    "bestFor": ["стейки", "котлеты с корочкой", "рыба-гриль", "овощи-гриль"],
    "dietNote": "Приоритет для Кристины — даёт корочку и 'богатый' вкус. Коле — только если очень хочется, без масла",
    "tips": "Разогреть 5 мин. Котлеты 6-7 мин на сторону. Рыба 4-5 мин"
  },
  {
    "id": "steamer",
    "name": "Пароварка",
    "emoji": "♨️",
    "bestFor": ["паровые котлеты", "омлет", "овощи", "рыба", "суфле"],
    "dietNote": "ОСНОВНОЙ способ для Коли — максимально щадящий для желудка",
    "tips": "Котлеты 25 мин, омлет 15 мин, овощи 12-15 мин, суфле 25 мин"
  },
  {
    "id": "blender",
    "name": "Блендер",
    "emoji": "🫙",
    "bestFor": ["пюре", "соусы", "крем-супы", "масса для суфле"],
    "dietNote": "Критически важен — вся еда должна быть мягкой текстуры",
    "tips": "Насадка для пюре — картошка, кабачок. Обычная — соусы, суфле-масса"
  },
  {
    "id": "mixer",
    "name": "Планетарный миксер",
    "emoji": "🎛️",
    "bestFor": ["вымес фарша", "взбивание белков", "тесто"],
    "dietNote": "Миксер вымешивает фарш лучше рук — котлеты получаются нежнее",
    "tips": "Фарш: насадка для теста, скорость 2. Белки: венчик, макс скорость"
  },
  {
    "id": "grinder",
    "name": "Гриндер",
    "emoji": "⚙️",
    "bestFor": ["фарш из мяса", "рыбный фарш"],
    "dietNote": "Свежий фарш мягче покупного. Для суфле — прогнать 2 раза",
    "tips": "Мясо нарезать кусками 3-4 см. Чередовать мясо и лук. Решётка мелкая для суфле"
  },
  {
    "id": "vacuum",
    "name": "Вакууматор",
    "emoji": "📦",
    "bestFor": ["порционная заморозка", "маринование", "хранение"],
    "dietNote": "Вакуум = нет морозильного ожога. Котлеты/суфле хранятся на 30-50% дольше",
    "tips": "Подписывать дату + название + кол-во порций. Замораживать плоско — быстрее размораживается"
  },
  {
    "id": "bowls",
    "name": "Миски",
    "emoji": "🥣",
    "bestFor": ["замес", "смешивание", "подготовка ингредиентов", "маринование"],
    "dietNote": null,
    "tips": "Большая — для фарша. Средняя — для соусов. Маленькие — для отмеривания"
  }
]
```

### 6. Роутинг

#### src/app/Router.tsx
```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';

// Lazy-loaded pages
const MenuPage = lazy(() => import('../pages/MenuPage'));
const DayPage = lazy(() => import('../pages/DayPage'));
const RecipesPage = lazy(() => import('../pages/RecipesPage'));
const RecipeDetailPage = lazy(() => import('../pages/RecipeDetailPage'));
const RecipeFormPage = lazy(() => import('../pages/RecipeFormPage'));
const PrepPage = lazy(() => import('../pages/PrepPage'));
const FreezerPage = lazy(() => import('../pages/FreezerPage'));
const ShoppingPage = lazy(() => import('../pages/ShoppingPage'));

const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      { path: '/', element: <MenuPage /> },
      { path: '/day/:date', element: <DayPage /> },
      { path: '/recipes', element: <RecipesPage /> },
      { path: '/recipe/new', element: <RecipeFormPage /> },
      { path: '/recipe/:id', element: <RecipeDetailPage /> },
      { path: '/recipe/:id/edit', element: <RecipeFormPage /> },
      { path: '/prep', element: <PrepPage /> },
      { path: '/freezer', element: <FreezerPage /> },
      { path: '/shopping', element: <ShoppingPage /> },
    ],
  },
], {
  basename: '/SemeynoYeda',  // ← для GitHub Pages (БЕЗ trailing slash)
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### 7. GitHub Pages деплой

#### .github/workflows/deploy.yml
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
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

#### Включить GitHub Pages
1. Репозиторий → Settings → Pages
2. Source: **GitHub Actions**

### 8. Скрипты package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "process-recipes": "tsx scripts/process-recipes.ts"
  }
}
```

---

## Порядок реализации (для Cursor)

### Фаза 1: Скелет (1 сессия)
1. ✅ Инициализация проекта (vite + deps)
2. ✅ Tailwind конфиг с кастомной темой
3. ✅ Типы данных `schema.ts`
4. ✅ База Dexie.js `db.ts`
5. ✅ Layout: `PageShell`, `Header`, `BottomNav`
6. ✅ Роутинг со всеми маршрутами (заглушки страниц)
7. ✅ PWA манифест + Service Worker

### Фаза 2: Данные (1 сессия)
1. Наполнить JSON рецептами из документа меню
2. `useRecipes` hook — CRUD из IndexedDB
3. `useMenu` hook — недельное меню
4. Инициализация: JSON → IndexedDB при первом запуске

### Фаза 3: Экраны (2-3 сессии)
1. **Меню недели** — WeekView с горизонтальным скроллом
2. **Карточка рецепта** — RecipeCard + RecipeDetail
3. **Замена блюда** — SwapModal с поиском по рецептам
4. **Каталог рецептов** — фильтры, поиск, категории
5. **Форма рецепта** — добавление + редактирование

### Фаза 4: Полировка (1 сессия)
1. Анимации появления
2. Пустые состояния
3. Toast-уведомления
4. Тестирование PWA на телефоне
5. GitHub Pages деплой

---

## Команды для Cursor

Когда хочешь, чтобы Cursor помог с задачей, используй эти промпты:

### Создать компонент
```
Создай компонент RecipeCard по стайл-гайду из STYLEGUIDE.md. 
Props: recipe (тип Recipe из schema.ts), onClick. 
Показывает: название, время, теги, для кого (цветовая полоска).
Tailwind, Lucide иконки, анимация появления.
```

### Обработать рецепт из inbox
```
В data/inbox/ есть новый файл. Прочитай его, преобразуй в JSON по схеме Recipe 
из src/data/schema.ts. Автоматически определи теги. Сохрани в src/data/recipes/.
```

### Добавить фичу
```
Добавь генерацию списка покупок. Hook useShoppingList должен:
1. Взять текущее меню недели
2. Собрать все ингредиенты из рецептов
3. Агрегировать одинаковые (суммировать количество)
4. Сгруппировать по категориям
Компонент ShoppingList с чекбоксами.
```

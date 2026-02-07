# Словарь элементов дизайна — Dimension Kitchen v2

Справочник UI-элементов по страницам и компонентам. Все классы соответствуют [STYLEGUIDE.md](STYLEGUIDE.md) и палитре в [src/styles/globals.css](src/styles/globals.css).

---

## Структура словаря

Для каждой страницы/компонента указаны:

- Элементы интерфейса (заголовки, карточки, кнопки, формы)
- Варианты отображения (загрузка, пустые состояния, ошибки)
- Состояния кнопок (default, hover, active, disabled, loading)
- Классы Tailwind или inline styles для каждого элемента

---

## Базовые микрокомпоненты

### Badge (участник)

Тонкий бейдж с цветной точкой и свечением. Три варианта:

| Вариант | main | bg (8% opacity) | border (20% opacity) | label |
|---------|------|-----------------|---------------------|-------|
| Коля | `#00E5FF` | `rgba(0,229,255,0.08)` | `rgba(0,229,255,0.2)` | К, Коля |
| Кристина | `#FF6B9D` | `rgba(255,107,157,0.08)` | `rgba(255,107,157,0.2)` | Кр, Кристина |
| Оба | `#39FF14` | `rgba(57,255,20,0.08)` | `rgba(57,255,20,0.2)` | Оба |

```tsx
<Badge color={memberMain} bg={memberBg} border={memberBorder}>Коля</Badge>
```

Визуально: `[● Коля]` — точка 6×6 с glow + текст 12px 600.

### Tag (тег рецепта)

Компактный тег с фоновой подложкой. 4 типа:

| type | bg | text | border |
|------|----|------|--------|
| safe (Щадящее) | `#0D2818` | `#39FF14` | `#1A4030` |
| freeze (Заморозка ❄️) | `#0D1B28` | `#00E5FF` | `#1A3040` |
| quick (Быстро ⚡) | `#281A0D` | `#FF9100` | `#403020` |
| prep (Заготовка 📦) | `#1A0D28` | `#B388FF` | `#2D1A40` |

Размеры: padding `2px 8px`, border-radius 4px, font 11px 600.

### Pill (фильтр-кнопка)

Переключатель-pill для фильтров и табов:
- Active: `bg: portal-glow`, `color: portal`, `outline: 1px solid portal@30%`
- Inactive: `bg: transparent`, `color: muted`
- Padding: `6px 14px`, border-radius 20px, font 12px 600

### Section (заголовок секции)

```tsx
<div style={{ borderBottom: '1px solid elevated', paddingBottom: 12, marginBottom: 20 }}>
  <h2 style={{ fontWeight: 800, fontSize: 22 }}>{title}</h2>
</div>
```

### Issue (карточка проблемы)

Для UX ревью и трекинга задач:
- Цветная полоска 3px слева (severity color)
- Severity badge: mono 10px, bg color@15%
- Severity: critical=pink, major=orange, minor=yellow, enhance=portal

---

## Страницы

### MenuPage (`/`)

| Элемент | Стили | Примечание |
|--------|-------|------------|
| Заголовок | heading 22px 800 text-primary | «Меню недели» |
| Sector label | mono 10px portal-dim, letter-spacing 1.5 | Декоративный |
| Week Overview | горизонтальная полоска 7 ячеек | см. ниже |
| Day filters | ряд Pill кнопок (Пн-Вс + "Вся неделя") | |
| Meal filters | ряд Pill кнопок (Завтрак/Обед/Полдник/Ужин) | |
| Кнопка «Новое из шаблона» | secondary border-portal/50 text-portal, иконка Copy | |
| WeekStats | expandable card с bar chart | |
| AlertBanner | dismissable alert для морозилки | |
| Day card | bg-dark, border elevated, radius 16 | |
| Пустое состояние | «Вселенная голодна 🌀 Запланируем неделю?» | |

**Week Overview:**

```
┌────┬────┬────┬────┬────┬────┬────┐
│ ПН │ ВТ │ СР │ ЧТ │ ПТ │ СБ │ ВС │
│3фев│4фев│5фев│6фев│7фев│8фев│9фев│
│●●●●│●●●●│●●●●│●●●●│●●●●│ 📦 │ 📦 │
└────┴────┴────┴────┴────┴────┴────┘
```

- Каждая ячейка: min-width 52px, padding 8×6, radius 12
- Active: portal-soft bg, portal@30% border, portal text
- Prep day: purple text, 📦 icon
- Точки: 4×4, portal-dim (заполненные) / elevated (пустые)

**Day Header:**

```tsx
<div style={{ padding: '16px 18px 12px', borderBottom: '1px solid elevated' }}>
  <div style={{ fontFamily: mono, fontSize: 10, color: portalDim, letterSpacing: 1.5 }}>DIM-MON · SECTOR 1</div>
  <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 20 }}>Понедельник</div>
  <div style={{ fontFamily: mono, fontSize: 11, color: muted }}>3 февраля</div>
</div>
```

**MealSlot (аккордеон):**

| Элемент | Стили |
|--------|-------|
| Контейнер свёрнутый | transparent, border transparent |
| Контейнер развёрнутый | bg card, border elevated, radius 12 |
| Header кнопка | width 100%, flex, gap 10, padding 12×14 |
| Иконка приёма | emoji 18px, width 28 |
| Название приёма | heading 14px 700 |
| Время | mono 11px muted |
| Chevron | 10px muted, rotate(180) при открытом |
| Блюдо: полоска слева | 3px × 24px, member color, opacity 0.6 |
| Блюдо: название | heading 13px 500 |
| Блюдо: подзаголовок | heading 11px muted |
| Блюдо: badge | мини-бейдж 10px (К, Кр, Оба) |
| Блюдо: swap | 28×28 кнопка, radius 8, border elevated, bg dark, ⇄ |
| Иконка морозилки | ❄️ Snowflake 14px frost |
| Иконка с собой | 🥡 10px miso (для lunch + packable) |
| Разделитель блюд | borderTop: 1px solid dark |

---

### RecipesPage (`/recipes`)

| Элемент | Стили |
|--------|-------|
| Заголовок | heading 22px 800 |
| Кнопка «+ Новый» | Link /recipe/new, primary small |
| Поиск | input bg-rift, border-nebula, pl-10 с иконкой Search |
| Category filter | ряд Pill кнопок |
| Person filter | Коля (cyan) / Кристина (pink) / Оба |
| Quick filters | «Быстрый завтрак», «С собой» |
| Пустое состояние | «Рецепты не найдены» text-center |

**Карточка рецепта — полная (каталог):**

```
┌──────────────────────────────┐
│ [🍗] Куриные котлеты [● Оба]│
│      ⏱ 30 мин · 20 порций   │
│ [Щадящее] [❄️ Заморозка]    │
│ [⚙️ Гриндер][🎛️ Миксер]    │
│ 🧊 Холод.: 2 дн. ❄️ 3 мес. │
└──────────────────────────────┘
```

- Radius: 14px. Padding: 18px.
- Icon: 44×44, radius 12, bg elevated.
- Hover: border portal@30%, glow shadow, translateY(-2px).
- Transition: `0.25s cubic-bezier(0.4,0,0.2,1)`.

**Карточка рецепта — компактная (SwapModal, поиск):**

```
┌─────────────────────────────┐
│ [🍗] Куриные котлеты [● Оба]│
│      30 мин · 20 порц. · ❄️ │
└─────────────────────────────┘
```

- Flex row. Padding: 12×14. Radius: 12.
- Icon: 40×40, radius 10.
- Meta: mono 11px muted.

---

### RecipeDetailPage (`/recipe/:id`)

| Элемент | Стили |
|--------|-------|
| Breadcrumbs | mono 11px muted, `/` opacity 0.3 |
| Sector label | mono 10px portal-dim, `РЕЦЕПТ · СОУС` |
| Заголовок | heading 26px 900 |
| Подзаголовок | heading 13px muted |
| Иконка рецепта | 52×52, radius 14, bg card, border elevated |
| Badge участника | компонент Badge |
| Теги | ряд Tag компонентов |
| Stats bar | 4 ячейки: время, порции, холодильник, морозилка |
| Equipment cards | 2 колонки, icon + name + setting |
| Кнопка «Изменить» | primary, иконка ✏️ |
| Кнопка «Удалить» | secondary, иконка 🗑 |
| Секция «Ингредиенты» | bg-dimension border-nebula rounded-card p-5 |
| Секция «Приготовление» | нумерованные шаги |
| Секция «Разогрев» | для рецептов с reheating |
| Секция «Заметки» | при наличии notes |

**Stats Bar:**

```
┌──────┬──────┬──────┬──────┐
│  ⏱   │  🍽  │  🧊  │  ❄️  │
│Время │Порции│Холод.│Мороз.│
│20 мин│  6   │4 дн. │3 мес.│
└──────┴──────┴──────┴──────┘
```

Flex row, gap 1, radius 10, overflow hidden, bg card, border elevated. Каждая ячейка: flex-1, padding 10×8, text-center, borderLeft.

**Recipe Actions:**

```
┌────────────────┬────┐
│ ✏️ Изменить     │ 🗑 │
└────────────────┴────┘
```

---

### PrepPage (`/prep`)

| Элемент | Стили |
|--------|-------|
| Заголовок | «Заготовки выходного дня» |
| Summary card | кол-во рецептов, время, порции |
| Progress bar | h-3, bg elevated, fill portal+glow |
| Equipment timeline | простой bar chart |
| Phase header | mono label + heading title + counter badge |
| Task card | checkbox + content, см. ниже |

**Phase Header:**

```
┌──────────────────────────────┐
│ ЧАС 1 · ФАРШ           2/4 │
│ Фарш и формовка             │
│ ▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱           │
└──────────────────────────────┘
```

- Sector label: mono 10px purple, letter-spacing 1.5
- Title: heading 18px 800
- Counter: mono 12px, padding 4×10, radius 8
  - All done: portal text, portal-soft bg, portal@30% border
  - In progress: muted text, card bg, elevated border
- Progress bar: h-3, bg elevated, fill portal with glow shadow

**Task Card:**

```
┌──────────────────────────────┐
│ [✓] Лук отварить до мягкости │
│     Свино-говяжьи котлеты    │
│     10 мин · 🔥 Плита · ⚡   │
│     💡 Пока варится — нарезать│
└──────────────────────────────┘
```

- Checkbox: 22×22, radius 6, border 2px
  - Done: bg portal, border portal, ✓ inverse 12px 900
  - Not done: border elevated
- Done state: opacity 0.45, text line-through
- Recipe: mono 10px muted
- Time: mono 10px orange
- Equipment: mono 10px, padding 1×6, radius 4, bg card, border elevated
- Parallel: mono 10px cyan `⚡ парал.`
- Tip: heading 11px portal-dim, padding 4×8, radius 6, bg portal-soft, borderLeft 2px portal@30%

---

### FreezerPage (`/freezer`)

| Элемент | Стили |
|--------|-------|
| Заголовок | Snowflake icon frost + «Морозилка» |
| AlertBanner | expiring items warning |
| Карточка элемента | bg-dimension, border-nebula, rounded-card, p-4 |
| Portions display | `portionsRemaining / portionsOriginal` |
| Expiry warning | цвет по дате: >30д green, 7-30д orange, <7д red |
| Кнопка «Use portions» | ghost button |
| Кнопка «Add to freezer» | form с recipe select |
| Delete confirmation | Modal через createPortal |
| Пустое состояние | «Пустота... как в измерении без еды ❄️» |

---

### ShoppingPage (`/shopping`)

| Элемент | Стили |
|--------|-------|
| Заголовок | ShoppingCart icon portal + «Список покупок» |
| Progress bar | h-2, bg-rift, fill portal gradient |
| Item checked | border-nebula opacity-60 |
| Item missing | border-ramen bg-ramen/10 |
| Item covered by freezer | coveredByFreezer badge frost |
| Checkbox | w-5 h-5, portal active, nebula inactive |
| Кнопка «Очистить» | Secondary, при checkedCount > 0 |

---

### CookingPage (`/cooking`)

| Элемент | Стили |
|--------|-------|
| Заголовок | ChefHat icon portal + «Параллельная готовка» |
| Meal buttons: active | border-portal bg-portal-mist shadow-glow text-portal |
| Meal buttons: inactive | border-nebula bg-rift hover:border-portal/30 text-text-mid |
| Timer card | bg-rift, border-portal/30, shadow-glow |

---

## Общие компоненты

### PageShell

```
┌─────────────────────────────────────┐
│ SemeynoYeda              [Повар ON] │  ← sticky header
├─────────────────────────────────────┤
│ 📅Меню  📖Рецепты  🧊Морозилка ... │  ← section nav
├─────────────────────────────────────┤
│ Breadcrumbs                         │
│ {page content}                      │
└─────────────────────────────────────┘
```

| Элемент | Стили |
|--------|-------|
| Header | sticky top-0 z-50 bg-dimension border-b border-nebula |
| Title | heading text-xl bold text-light, Link to "/" |
| Section nav | overflow-x-auto, gap 2px |
| Section link active | text-portal border-b-2 border-portal |
| Section link inactive | text-ghost border-b-2 border-transparent |
| Main | min-h-screen bg-void, pb-20, chef-mode / normal-mode class |

### BottomNav

| Элемент | Стили |
|--------|-------|
| Container | bg-panel, radius 20, padding 6, border elevated, max-w-360, margin auto |
| Tab active | bg portal-soft, icon normal, text portal, green underline 16×2 with glow |
| Tab inactive | icon grayscale(0.6) opacity(0.4), text muted |
| Tab button | flex-1, padding 10×0 8×0, radius 14, flex-col align-center |
| Icon | 18px emoji |
| Label | heading 10px 700 |
| Underline | absolute bottom 4, 16×2, radius 1, portal bg+glow |

**Normal mode:** Меню / Рецепты / Морозилка / Покупки
**Chef mode:** Меню / Рецепты / Заготовки / Морозилка / Покупки

### ChefModeToggle

| Элемент | Стили |
|--------|-------|
| Active | bg gradient portal→portal-dim, text void, shadow glow |
| Inactive | bg rift, border nebula, text text-mid, hover bg-nebula |
| Size | px-3 py-1.5, rounded-button |
| Font | heading semibold text-xs |
| Icon | ChefHat w-4 h-4 |
| Label active | «👨‍🍳 Повар ON» |
| Label inactive | «Режим повара» |

### Chef Mode Overlay (floating)

```
┌──────────────────────────────────────┐
│▰▰▰▰▰▰▰▰▰▰▰▰▰▰ (orange→yellow line)│
│ 👨‍🍳 Режим повара                     │
│    АКТИВЕН · 2 из 8 шагов           │
│ ┌──────────────────────────────┐     │
│ │ [⏱] Варим лук — 8:32        │     │
│ │     🔥 Плита · средний огонь │     │
│ │                    [Далее →] │     │
│ └──────────────────────────────┘     │
└──────────────────────────────────────┘
```

- Border: accent-orange@20%
- Gradient top line: orange → yellow, height 3px
- Timer icon: 36×36, radius 10, bg orange@15%, border orange@30%
- Timer value: heading 13px 600
- Equipment: mono 11px muted
- "Далее →" button: heading 12px 700 portal, bg portal-soft, border portal@30%

### Modal

**Рендеринг:** `createPortal(modal, document.body)` — всегда!

| Элемент | Стили |
|--------|-------|
| Overlay | fixed inset-0, bg void/80, backdrop-blur(12px), z-index: 9999 |
| Window | bg-rift, border-nebula, rounded-modal, shadow-elevate, max-w-md, p-6 |
| Title | heading text-xl bold text-light mb-4 |
| Close button | X icon, top-right |
| Animation | animate-fade-in |
| Close triggers | click overlay, click X, press Escape |

### SwapModal

Расширение Modal для замены рецепта:

| Элемент | Стили |
|--------|-------|
| Search input | bg-rift border-nebula, pl-10 с Search icon |
| Filter: forWhom | Pill buttons (Коля/Кристина/Оба) |
| Recipe list | compact RecipeCard, hover border |
| Recently used | (planned) секция «Недавно использованные» вверху |

### AlertBanner

| Тип | border | bg | icon |
|-----|--------|----|------|
| low-stock | ramen/30 | ramen/10 | ⚠️ ramen |
| expiring | ramen/30 | ramen/10 | ⚠️ ramen |
| suggestion | frost/30 | frost/10 | 💡 frost |

Dismissable с кнопкой X.

### WeekStats

Expandable card с анализом разнообразия меню:
- Bar chart категорий
- Предупреждения (repeat >3 раза)

### Breadcrumbs

| Элемент | Стили |
|--------|-------|
| Container | mono 11px muted, flex align-center gap-4 |
| Link | portal-dim, cursor-pointer |
| Separator | `/` opacity 0.3 |
| Current page | text-secondary |

### IngredientCheck

| Элемент | Стили |
|--------|-------|
| Available | CheckCircle2 text-portal, border-portal bg-portal-mist |
| Missing | XCircle text-ramen, border-ramen bg-ramen/10 |
| Unknown | HelpCircle text-text-dim, border-nebula bg-dimension |
| Buttons | «Есть» bg-portal text-void, «Нет» bg-ramen text-void |
| Complete | «Ингредиенты проверены, Морти» bg-portal-mist border-portal |

---

## Формы и инпуты

### Text Input

```css
width: 100%;
background: var(--rift);
border: 1px solid var(--nebula);
border-radius: var(--radius-button);
padding: 8px 16px;
color: var(--text-primary);
font-family: var(--font-body);
/* focus */
outline: none;
border-color: var(--portal);
box-shadow: 0 0 0 2px var(--portal-glow);
```

С иконкой поиска: `padding-left: 40px`, иконка `absolute left-12px`.

### Select / Date / Number

Те же стили, что и text input. Options: bg-rift text-primary.

### Label

```css
display: block;
font-size: 14px;
font-family: var(--font-heading);
font-weight: 600;
color: var(--text-secondary);
margin-bottom: 8px;
```

### Toggle Switch

```css
/* Container: 44×24, radius pill */
/* Active: bg portal gradient, shadow glow */
/* Inactive: bg nebula */
/* Thumb: 16×16 circle, bg void, translate-x toggle */
```

### Checkbox

```css
/* 22×22 or 20×20, radius 6px, border 2px */
/* Checked: bg portal, border portal, ✓ inverse */
/* Unchecked: border elevated or nebula, hover border-portal */
```

---

## Состояния кнопок

### Primary
```css
background: var(--portal-dim);  /* или gradient portal → portal-dim */
color: var(--text-inverse);
font-weight: 700; font-size: 13px;
border-radius: 10px;
padding: 10px 16px;
/* hover: shadow-glow */
/* disabled: opacity 0.6 */
```

### Secondary
```css
background: transparent;
border: 1px solid var(--elevated);
color: var(--text-muted);
font-weight: 600; font-size: 13px;
border-radius: 10px;
padding: 10px 16px;
```

### Ghost
```css
background: var(--rift);
border: 1px solid var(--nebula);
color: var(--text-primary);
font-weight: 600; font-size: 12px;
border-radius: 10px;
padding: 8px 12px;
/* hover: bg nebula, border portal/30 */
```

### Danger
```css
background: rgba(255,107,157,0.1);
border: 1px solid rgba(255,107,157,0.3);
color: #FF6B9D;
```

### Filter (Pill)
```css
/* Active: bg portal-glow, color portal, outline 1px solid portal@30% */
/* Inactive: bg transparent, color muted, outline transparent */
padding: 6px 14px; border-radius: 20px;
```

---

## Диаграмма состояний кнопок

```mermaid
stateDiagram-v2
    [*] --> Default
    Default --> Hover: mouseEnter
    Hover --> Default: mouseLeave
    Default --> Active: click
    Active --> Default: click
    Default --> Disabled: setDisabled
    Disabled --> Default: setEnabled
    Default --> Loading: asyncAction
    Loading --> Default: complete
    Loading --> Error: fail
    Error --> Default: retry
```

---

## Сравнение: до и после (из UX ревью)

| Аспект | Было | Стало |
|--------|------|-------|
| Дневное меню | Всё раскрыто, длинный скролл | Аккордеон — 1 приём развёрнут |
| Обзор недели | Нет | Компактная полоска с точками |
| Бейджи Коля/Кристина | Яркие плашки (portal/ramen) | Тонкий cyan/pink с точкой |
| Кнопка ⇄ | Мелкая иконка | 28×28 с hover |
| Карточка рецепта | Плоская | 2 варианта: полная + компактная |
| Страница рецепта | Плоский список | Stats bar + equipment cards |
| Чек-лист заготовок | Без прогресса | Progress bar + phases + tips |
| Навигация | Эмодзи+текст в скролле | Bottom nav 4 таба с glow |
| Теги | Зелёный/оранж текст, без фона | Фоновые подложки с border |

---

## Где вносить правки

- **Цвета, шрифты, тени, скругления:** [src/styles/globals.css](src/styles/globals.css) и [tailwind.config.ts](tailwind.config.ts)
- **Полный справочник стилей и философия:** [STYLEGUIDE.md](STYLEGUIDE.md)
- **Новые элементы:** добавлять сюда в словарь и при необходимости в STYLEGUIDE.md

# 🟢 Dimension Kitchen — Style Guide

**Словарь элементов по страницам и компонентам:** см. [DESIGN_DICTIONARY.md](DESIGN_DICTIONARY.md) — там перечислены все UI-элементы, классы и примеры кода.

---

## Как вносить правки в дизайн

- **Цвета** — только из палитры: `void`, `dimension`, `rift`, `nebula`, `portal`, `ramen`, `miso`, `matcha`, `sakura`, `frost`, `plasma`. Текст: `text-light`, `text-mid`, `text-dim`, `text-ghost`. Фоны: `bg-void`, `bg-dimension`, `bg-rift`.
- **Типографика** — заголовки: `font-heading` (Chakra Petch), размеры `text-xl`–`text-3xl`; основной текст: `font-body` (DM Sans); данные/время: `font-mono` (JetBrains Mono), цвет `text-portal`.
- **Компоненты** — карточки: `bg-dimension border border-nebula rounded-card p-4 shadow-card`; кнопки — классы из этого гайда (Primary, Secondary, Ghost). Скругления: `rounded-button` (10px), `rounded-card` (16px), `rounded-modal` (20px), `rounded-pill` (9999px).
- **Где править:** глобальные стили и переменные — [src/styles/globals.css](src/styles/globals.css); конфиг Tailwind — [tailwind.config.ts](tailwind.config.ts); стили в компонентах — через `className` в TSX. При добавлении новых паттернов обновлять [STYLEGUIDE.md](STYLEGUIDE.md) и [DESIGN_DICTIONARY.md](DESIGN_DICTIONARY.md).

---

## Философия дизайна

**Концепция: "Портал Рика ведёт на кухню"**

Тёмный void как основа. Портальный зелёный (#39FF14) — навигация и интерактив. Тёплые «фудовые» цвета (ramen, miso, matcha, sakura) — контент о еде. Anime-чистые линии. Sci-fi типографика Chakra Petch. Уютно внутри, дерзко снаружи.

**Три столпа:**
- **Dark Foundation** — глубокий космический фон, карточки чуть светлее, белый не используется
- **Portal Navigation** — зелёный портал = всё интерактивное (кнопки, ссылки, акценты, индикаторы)
- **Food Warmth** — контент о еде окрашен тёплыми цветами: оранжевый ramen, розовый sakura, зелёный matcha

---

## 1. Цветовая палитра

### Core — фоны и поверхности
```css
:root {
  --void:       #0B0E14;   /* Основной фон — глубокий космос */
  --dimension:  #141821;   /* Карточки, панели */
  --rift:       #1C2230;   /* Поднятые элементы, модалки */
  --nebula:     #252D3B;   /* Hover, бордеры, разделители */
}
```

### Portal — акценты и интерактив
```css
:root {
  --portal:      #39FF14;                /* Главный акцент — портал Рика */
  --portal-dim:  #2BD911;                /* Hover на акценте */
  --portal-glow: rgba(57,255,20,0.15);   /* Свечение, glow эффекты */
  --portal-mist: rgba(57,255,20,0.06);   /* Едва заметный тинт фона */
}
```

### Food — еда и контент
```css
:root {
  --ramen:  #FFB347;   /* Тёплый оранжевый — основной «фудовый» цвет */
  --miso:   #E8985A;   /* Глубокий тёплый — вторичные элементы еды */
  --matcha: #8DB580;   /* Приглушённый зелёный — овощи, здоровое */
  --sakura: #FFB7C5;   /* Нежный розовый — десерты, сладкое */
  --frost:  #8DB5E0;   /* Холодный голубой — морозилка, заморозка */
}
```

### Text — иерархия
```css
:root {
  --text-light: #F0EDE8;   /* Основной текст */
  --text-mid:   #9BA3B2;   /* Вторичный текст, описания */
  --text-dim:   #5A6270;   /* Подписи, мета-информация */
  --text-ghost: #3A4150;   /* Плейсхолдеры, неактивные элементы */
}
```

### Family — кто ест
```css
:root {
  --kolya:    #39FF14;   /* Портал-грин — щадящее, гастрит */
  --kristina: #FFB347;   /* Рамен-оранж — богатая, сытная еда */
  --both:     #B197FC;   /* Плазма-фиолет — общие блюда */
}
```

---

## 2. Типографика

### Шрифты
```css
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-heading: 'Chakra Petch', sans-serif;   /* Sci-fi заголовки */
  --font-body:    'DM Sans', sans-serif;          /* Чистый body текст */
  --font-mono:    'JetBrains Mono', monospace;     /* Данные, время, температура */
}
```

### Шкала

| Роль | Шрифт | Размер | Вес | Цвет | Пример |
|------|-------|--------|-----|------|--------|
| Display | Chakra Petch | 36px | 800 | --text-light | Hero заголовки |
| H1 | Chakra Petch | 28px | 800 | --text-light | Заголовки секций |
| H2 | Chakra Petch | 22px | 700 | --text-light | Заголовки карточек |
| H3 | Chakra Petch | 18px | 700 | --text-mid | Подзаголовки |
| Body | DM Sans | 15px | 400 | --text-mid | Основной текст |
| Small | DM Sans | 13px | 400 | --text-dim | Описания |
| Label | Chakra Petch | 12px | 600 | --text-dim | ЗАВТРАК, ЗАГОТОВКА |
| Mono | JetBrains Mono | 13px | 500 | --portal | ⏱ 25 мин · 180°C |

---

## 3. Пространство

### Отступы
```css
--space-1: 4px;    --space-2: 8px;    --space-3: 12px;
--space-4: 16px;   --space-5: 24px;   --space-6: 32px;   --space-8: 48px;
```

### Скругления
```css
--radius-button: 10px;   --radius-card: 16px;
--radius-modal: 20px;    --radius-pill: 9999px;
```

### Тени
```css
--shadow-card:    0 2px 8px rgba(0,0,0,0.3);
--shadow-glow:    0 4px 16px rgba(57,255,20,0.15);
--shadow-elevate: 0 8px 32px rgba(0,0,0,0.5);
--shadow-nav:     0 -4px 20px rgba(0,0,0,0.4);
```

---

## 4. Компоненты

### Карточка рецепта
- Фон: `--dimension`, бордер `--nebula`
- Hover: бордер `portal @ 30%`, тень `--shadow-glow`, `translateY(-2px)`
- Мета-данные: `--font-mono`, `--portal`
- Оборудование: пилюли с эмодзи

### Слот приёма пищи
- Цветная полоска 3px слева для каждого профиля
- Кнопка "заменить": ghost portal
- Время: `--font-mono`

### Теги
Формула: `bg: rgba(цвет, 0.12)`, `border: rgba(цвет, 0.3)`, `color: цвет`

| Тег | Цвет | Эмодзи |
|-----|------|--------|
| щадящее | portal | ♨️ |
| заморозка | frost | ❄️ |
| быстро | ramen | ⚡ |
| заготовка | plasma | 📦 |
| сытно | miso | 🔥 |
| prep-day | portal-dim | 🧪 |

### Кнопки
- **Primary:** gradient portal → portal-dim, текст void, тень glow
- **Secondary:** transparent, бордер nebula, текст light
- **Danger:** bg `rgba(FF6B6B, 0.1)`, текст/бордер #FF6B6B
- Все: radius-button (10px), font-heading, 600, 13px

### Bottom Navigation
- Фон dimension, бордер-top nebula, тень nav
- Active: текст portal + зелёная полоска 3px сверху с glow
- Inactive: text-ghost
- Эмодзи 20px + label font-heading 10px

### Family Indicators
- 🟢 Коля: #39FF14 + glow
- 🟠 Кристина: #FFB347 + glow  
- 🟣 Оба: #B197FC + glow

### Мета-данные рецептов (время и порции)

**Требования к spacing:**
- Расстояние между элементами: `gap-2` (8px)
- Визуальный разделитель: точка `·` в цвете `text-dim`
- Шрифт: `font-mono`, размер `text-xs`
- Цвет: `text-portal` для значений

**Пример:**
```tsx
<div className="flex items-center gap-2 text-xs font-mono text-portal">
  <span>⏱ {time} мин</span>
  <span className="text-text-dim">·</span>
  <span>{servings} порций</span>
</div>
```

**Применение:**
- Карточки рецептов в списке (RecipesPage) — использует `gap-2` с разделителем
- Детальная страница рецепта (RecipeDetailPage) — использует `gap-4` без разделителя (оставить как есть для большей читаемости)
- Любые другие места отображения времени и порций

### Header/PageShell

**Структура:**
- Фон: `bg-dimension`, бордер-bottom: `border-nebula`
- Позиционирование: `sticky top-0 z-50`
- Тень: `shadow-nav`
- Контейнер: `container mx-auto px-4 py-3`
- Расположение: заголовок слева (`font-heading text-xl font-bold text-text-light`), ChefModeToggle справа

**Пример:**
```tsx
<header className="sticky top-0 z-50 bg-dimension border-b border-nebula shadow-nav">
  <div className="container mx-auto px-4 py-3 flex items-center justify-between">
    <h1 className="font-heading text-xl font-bold text-text-light">SemeynoYeda</h1>
    <ChefModeToggle />
  </div>
</header>
```

### ChefModeToggle

**Кнопка переключения режима повара:**
- Активное состояние: `bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow`
- Неактивное состояние: `bg-rift border border-nebula text-text-mid hover:bg-nebula`
- Размеры: `px-4 py-2`, `rounded-button`
- Шрифт: `font-heading font-semibold text-sm`
- Иконка: `ChefHat` из lucide-react, размер `w-4 h-4`

### Формы и инпуты

**Text Input (поиск):**
- Фон: `bg-rift`, бордер: `border-nebula`
- Скругление: `rounded-button`
- Padding: `px-4 py-2` (для поиска с иконкой: `pl-10`)
- Текст: `text-text-light font-body`
- Focus: `focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow`
- Placeholder: `text-text-dim`

**Поиск с иконкой:**
- Контейнер: `relative`
- Иконка: `absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-dim`
- Input: `pl-10` для отступа под иконку
- Иконка: `Search` из lucide-react

**Date Input:**
- Те же стили что и text input
- Можно добавить иконку Calendar слева через `absolute` позиционирование

**Select Dropdown:**
- Те же стили что и text input
- Опции: `bg-rift text-text-light`

**Label для форм:**
- Стиль: `block text-sm font-heading font-semibold text-text-mid mb-2` (или `text-text-light` для важных полей)
- Всегда должен быть связан с полем через `id` и `htmlFor` или `id` и `name`

**Пример поиска с иконкой:**
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-dim" />
  <input
    type="text"
    id="recipe-search"
    name="recipe-search"
    className="w-full bg-rift border border-nebula rounded-button px-4 py-2 pl-10 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
    placeholder="Поиск рецептов..."
  />
</div>
```

**Пример обычного input:**
```tsx
<input
  type="text"
  className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
  placeholder="Поиск..."
/>
```

### Toggle Switch

**Переключатель (автогенерация списка покупок):**
- Контейнер: `relative inline-flex h-6 w-11 items-center rounded-pill`
- Активное состояние: `bg-gradient-to-r from-portal to-portal-dim shadow-glow`
- Неактивное состояние: `bg-nebula`
- Переключатель (кружок): `inline-block h-4 w-4 rounded-full bg-void`
- Позиция: `translate-x-6` (активно) или `translate-x-1` (неактивно)
- Transition: `transition-transform` и `transition-colors`

**Пример:**
```tsx
<button className={`relative inline-flex h-6 w-11 items-center rounded-pill transition-colors ${
  enabled ? 'bg-gradient-to-r from-portal to-portal-dim shadow-glow' : 'bg-nebula'
}`}>
  <span className={`inline-block h-4 w-4 transform rounded-full bg-void transition-transform ${
    enabled ? 'translate-x-6' : 'translate-x-1'
  }`} />
</button>
```

### Checkbox

**Квадратный чекбокс:**
- Размер: `w-5 h-5`
- Скругление: `rounded-button`
- Бордер: `border-2`
- Неактивное: `border-nebula hover:border-portal`
- Активное: `bg-portal border-portal`
- Иконка внутри: `CheckCircle2` из lucide-react, размер `w-3 h-3 text-void`
- Flex для центрирования: `flex items-center justify-center`

**Пример:**
```tsx
<button className={`w-5 h-5 rounded-button border-2 flex items-center justify-center transition-colors ${
  checked ? 'bg-portal border-portal' : 'border-nebula hover:border-portal'
}`}>
  {checked && <CheckCircle2 className="w-3 h-3 text-void" />}
</button>
```

### Progress Bar

**Прогресс-бар:**
- Контейнер: `h-2 bg-rift rounded-pill overflow-hidden`
- Заполнение: `h-full bg-gradient-to-r from-portal to-portal-dim shadow-glow`
- Ширина: динамическая через `style={{ width: '${progress}%' }}`
- Transition: `transition-all duration-300` (или `duration-1000` для таймеров)

**Пример:**
```tsx
<div className="h-2 bg-rift rounded-pill overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-portal to-portal-dim transition-all duration-300 shadow-glow"
    style={{ width: `${progress}%` }}
  />
</div>
```

### Loading States

**Единый стиль для всех состояний загрузки:**
- Контейнер: `bg-dimension border border-nebula rounded-card p-4`
- Текст: `text-text-mid font-body`
- Сообщение: "Загрузка..." или "Загрузка {контекст}..."

**Пример:**
```tsx
<div className="bg-dimension border border-nebula rounded-card p-4">
  <div className="text-text-mid font-body">Загрузка...</div>
</div>
```

### Empty States

**Пустые состояния страниц:**

**Меню (MenuPage):**
- Заголовок: "Вселенная голодна 🌀"
- Подзаголовок: "Запланируем неделю?"
- Кнопка: Primary стиль, текст "Посмотреть рецепты"

**Рецепты (RecipesPage):**
- Текст: "Рецепты не найдены"
- Центрирование: `text-center`

**Список покупок (ShoppingPage):**
- Текст: "Список покупок пуст"

**Таймеры (ParallelCooking):**
- Заголовок: "Параллельная готовка"
- Текст: "Нет активных таймеров. Таймер запущен в параллельной вселенной"

**Подготовка (PrepPage):**
- Текст: "Нет рецептов для выбранной даты. Вселенная голодна 🌀 Запланируем неделю?"

**Общий стиль:**
- Контейнер: `bg-dimension border border-nebula rounded-card p-5`
- Текст: `text-text-mid font-body`
- Центрирование: `text-center` (если нужно)

### PrepTaskCard

**Карточка задачи подготовки:**
- Фон: `bg-dimension`, бордер: `border-nebula`
- Скругление: `rounded-card`
- Padding: `p-3`
- Состояния:
  - Завершено: `opacity-60 border-nebula`
  - Активно: `hover:border-portal/30 hover:shadow-glow`
- Структура: чекбокс слева, контент справа (`flex items-start gap-3`)
- Группировка: эмодзи категории + название ингредиента
- Мета-информация: количество, единица измерения, время хранения

**Пример:**
```tsx
<div className={`bg-dimension border rounded-card p-3 transition-all ${
  completed ? 'border-nebula opacity-60' : 'border-nebula hover:border-portal/30 hover:shadow-glow'
}`}>
  <div className="flex items-start gap-3">
    {/* Checkbox */}
    <button className="w-5 h-5 rounded-button border-2 ...">...</button>
    {/* Content */}
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{GROUP_ICONS[group]}</span>
        <h4 className="font-heading font-semibold text-sm">{ingredient}</h4>
      </div>
      {/* Meta info */}
    </div>
  </div>
</div>
```

### CookingTimer Card

**Карточка активного таймера:**
- Фон: `bg-rift`, бордер: `border-portal/30`
- Скругление: `rounded-card`
- Тень: `shadow-glow`
- Анимация: `animate-pulse` (опционально)
- Структура:
  - Заголовок с иконкой Clock и названием таймера
  - Название рецепта (если есть)
  - Кнопки управления (pause/play, stop)
  - Прогресс-бар с временем и процентом

**Пример:**
```tsx
<div className="bg-rift border border-portal/30 rounded-card p-4 shadow-glow">
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-portal" />
      <h4 className="font-heading font-semibold text-text-light">{label}</h4>
    </div>
    {/* Кнопки управления */}
  </div>
  {/* Прогресс-бар */}
</div>
```

### IngredientCheck

**Компонент проверки ингредиентов:**
- Три состояния:
  - **Available** (есть): `CheckCircle2` зелёный (`text-portal`)
  - **Missing** (отсутствует): `XCircle` оранжевый (`text-ramen`)
  - **Unknown** (неизвестно): `HelpCircle` серый (`text-text-dim`)
- Карточка ингредиента: стандартная карточка с кнопками состояния
- Кнопки: три кнопки для выбора состояния

**Пример:**
```tsx
<div className="flex items-center gap-2">
  {availability === 'available' && <CheckCircle2 className="w-5 h-5 text-portal" />}
  {availability === 'missing' && <XCircle className="w-5 h-5 text-ramen" />}
  {availability === 'unknown' && <HelpCircle className="w-5 h-5 text-text-dim" />}
</div>
```

### RecipeDetailPage — шаги приготовления

**Нумерованные шаги:**
- Контейнер: `space-y-4` для вертикальных отступов
- Структура: номер слева, контент справа (`flex gap-3`)
- Номер шага:
  - Круг: `w-8 h-8 rounded-full bg-rift border border-nebula`
  - Текст: `text-sm font-heading font-semibold text-portal`
  - Центрирование: `flex items-center justify-center`
- Контент шага:
  - Текст: `text-text-light font-body`
  - Оборудование: `text-sm text-text-dim font-body`
  - Время: `text-xs font-mono text-portal`
  - Совет: `text-xs text-text-dim font-body italic` с эмодзи 💡

**Пример:**
```tsx
<ol className="space-y-4">
  {steps.map((step) => (
    <li key={step.order} className="flex gap-3">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-rift border border-nebula flex items-center justify-center text-sm font-heading font-semibold text-portal">
        {step.order}
      </span>
      <div className="flex-1">
        <p className="text-text-light font-body">{step.text}</p>
        {step.equipment && (
          <p className="text-sm text-text-dim font-body">{step.equipment.label}</p>
        )}
        {step.duration && (
          <p className="text-xs font-mono text-portal mt-1">⏱ {step.duration} мин</p>
        )}
      </div>
    </li>
  ))}
</ol>
```

### Фильтры (Filter Buttons)

**Горизонтальные фильтры:**
- Контейнер: `flex gap-2` с `overflow-x-auto`
- Кнопка:
  - Активная: `bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow`
  - Неактивная: `bg-rift border border-nebula text-text-mid hover:border-portal/30`
- Размеры: `px-3 py-1` или `px-4 py-2`
- Скругление: `rounded-button`
- Шрифт: `font-heading font-semibold text-xs` или `text-sm`
- `whitespace-nowrap` для предотвращения переноса

**Пример:**
```tsx
<div className="flex gap-2 overflow-x-auto">
  {filters.map((filter) => (
    <button
      key={filter.value}
      className={`px-3 py-1 rounded-button font-heading font-semibold text-xs whitespace-nowrap transition-colors ${
        active === filter.value
          ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow'
          : 'bg-rift border border-nebula text-text-mid hover:border-portal/30'
      }`}
    >
      {filter.label}
    </button>
  ))}
</div>
```

### Modal/Dialog

**Модальное окно:**
- Overlay: `fixed inset-0 bg-void/80 backdrop-blur-sm z-50`
- Контейнер: `fixed inset-0 flex items-center justify-center z-50 p-4`
- Модальное окно:
  - Фон: `bg-rift`, бордер: `border-nebula`
  - Скругление: `rounded-modal` (20px)
  - Тень: `shadow-elevate`
  - Максимальная ширина: `max-w-md w-full`
  - Padding: `p-6`
- Заголовок: `font-heading text-xl font-bold text-text-light mb-4`
- Контент: `text-text-mid font-body`
- Кнопки: внизу модального окна, `flex gap-3 justify-end`

**Пример:**
```tsx
<div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-rift border border-nebula rounded-modal shadow-elevate max-w-md w-full p-6">
    <h2 className="font-heading text-xl font-bold text-text-light mb-4">Заголовок</h2>
    <div className="text-text-mid font-body mb-6">
      {/* Контент */}
    </div>
    <div className="flex gap-3 justify-end">
      {/* Кнопки */}
    </div>
  </div>
</div>
```

### Toast/Notification

**Уведомления:**
- Контейнер: `fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50` (или `top-4 right-4`)
- Toast элемент:
  - Фон: `bg-rift`, бордер: `border-nebula` или `border-portal` для успеха
  - Скругление: `rounded-card`
  - Тень: `shadow-elevate`
  - Padding: `px-4 py-3`
  - Минимальная ширина: `min-w-[300px]`
  - Анимация: `animate-slide-up` или `animate-fade-in`
- Типы:
  - **Success**: `border-portal`, иконка `CheckCircle2` зелёная
  - **Error**: `border-ramen`, иконка `XCircle` оранжевая
  - **Info**: `border-nebula`, иконка `Info` серая
- Текст: `text-text-light font-body text-sm`
- Кнопка закрытия: `absolute top-2 right-2` с иконкой `X`

**Пример:**
```tsx
<div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
  <div className="bg-rift border border-portal rounded-card shadow-elevate px-4 py-3 min-w-[300px] flex items-center gap-3">
    <CheckCircle2 className="w-5 h-5 text-portal flex-shrink-0" />
    <p className="text-text-light font-body text-sm flex-1">Сообщение</p>
    <button className="text-text-dim hover:text-text-light">
      <X className="w-4 h-4" />
    </button>
  </div>
</div>
```

### CookingSession

**Сессия готовки (многошаговый компонент):**
- Контейнер: `space-y-6` для вертикальных отступов
- Заголовок сессии:
  - Фон: `bg-dimension`, бордер: `border-nebula`
  - Скругление: `rounded-card`
  - Тень: `shadow-card`
  - Padding: `p-5`
  - Иконка: `ChefHat` размер `w-6 h-6 text-portal`
  - Заголовок: `font-heading text-2xl font-bold text-text-light`
- Состояния:
  - **check** (проверка ингредиентов): показывает `IngredientCheck`
  - **cooking** (готовка): показывает `ParallelCooking` и инструкции
  - **complete** (завершено): карточка с `border-portal`, `shadow-glow`, иконка `CheckCircle2`
- Инструкции по готовке:
  - Контейнер: `bg-dimension border border-nebula rounded-card p-5`
  - Заголовок: `font-heading text-lg font-bold text-text-light mb-4`
  - Шаги: нумерованный список с круглыми индикаторами (как в RecipeDetailPage)
  - Кнопка завершения: Primary стиль, `w-full`

**Пример:**
```tsx
<div className="space-y-6">
  {/* Заголовок сессии */}
  <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
    <div className="flex items-center gap-3 mb-4">
      <ChefHat className="w-6 h-6 text-portal" />
      <h2 className="font-heading text-2xl font-bold text-text-light">Сессия готовки</h2>
    </div>
  </div>
  
  {/* Состояния */}
  {step === 'complete' && (
    <div className="bg-dimension border border-portal rounded-card p-5 shadow-glow">
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle2 className="w-6 h-6 text-portal" />
        <h3 className="font-heading text-xl font-bold text-portal">Готовка завершена!</h3>
      </div>
    </div>
  )}
</div>
```

### MealSlot (детальное описание)

**Слот приёма пищи:**
- Контейнер: `bg-dimension border border-nebula rounded-card p-4 shadow-card`
- Заголовок: `font-heading font-semibold text-text-light mb-2`
- Список рецептов: `space-y-1` с названием и индикатором "для кого"
- Индикатор "для кого":
  - Коля: `bg-portal/20 text-portal`
  - Кристина: `bg-ramen/20 text-ramen`
  - Оба: `bg-plasma/20 text-plasma`
  - Размер: `text-xs px-2 py-0.5 rounded-pill font-heading font-semibold`
- Предупреждение об отсутствующих ингредиентах:
  - Иконка: `AlertTriangle` размер `w-4 h-4 text-ramen`
  - Текст: `text-xs font-body text-ramen`
  - Позиция: справа вверху
- Кнопка проверки ингредиентов:
  - Стиль: Secondary (ghost)
  - Размер: `w-full mt-2`
  - Текст: `font-heading font-semibold text-xs`

**Пример:**
```tsx
<div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1">
      <h4 className="font-heading font-semibold text-text-light mb-2">Завтрак</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-body text-text-mid">Название рецепта</span>
          <span className="text-xs px-2 py-0.5 rounded-pill font-heading font-semibold bg-portal/20 text-portal">
            Коля
          </span>
        </div>
      </div>
    </div>
    {hasMissingIngredients && (
      <div className="flex items-center gap-1 text-ramen">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs font-body">Не хватает ингредиентов</span>
      </div>
    )}
  </div>
  <button className="w-full mt-2 bg-rift border border-nebula text-text-light font-heading font-semibold text-xs py-2 px-3 rounded-button hover:bg-nebula hover:border-portal/30 transition-colors">
    Проверить ингредиенты
  </button>
</div>
```

### ShoppingSettings

**Настройки покупок:**
- Контейнер: `bg-dimension border border-nebula rounded-card p-5 shadow-card`
- Заголовок: `font-heading text-xl font-bold text-text-light mb-4`
- Поля формы: `space-y-4`
- Label: `block text-sm font-heading font-semibold text-text-mid mb-2`
- Select: стили как у обычного select (см. "Формы и инпуты")
- Toggle Switch: стили как у обычного toggle (см. "Toggle Switch")
- Вспомогательный текст: `text-sm text-text-dim font-body mt-2`

---

## 5. Анимации

```css
/* Появление карточки */
@keyframes cardAppear {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Портальное свечение */
@keyframes portalPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(57,255,20,0.2); }
  50% { box-shadow: 0 0 24px rgba(57,255,20,0.35); }
}

/* Scroll snap */
.week-scroll { scroll-snap-type: x mandatory; }
.day-column { scroll-snap-align: start; }

/* Скроллбар */
::-webkit-scrollbar-thumb:hover { background: var(--portal); }
```

---

## 6. Тон контента

Гиковский, дружеский, с лёгким sci-fi вайбом. Отсылки к R&M — easter eggs, не в каждом экране.

- Пустое меню: "Вселенная голодна 🌀 Запланируем неделю?"
- Рецепт добавлен: "Рецепт в базе, Морти"
- Морозилка пуста: "Пустота... как в измерении без еды ❄️"
- Мало соусов: "Запасы соусов на нуле — prep day?"
- Ошибка: "Что-то пошло не так в этом измерении"

---

## 7. Tailwind конфиг

```typescript
export default {
  theme: {
    extend: {
      colors: {
        void:      { DEFAULT: '#0B0E14' },
        dimension: { DEFAULT: '#141821' },
        rift:      { DEFAULT: '#1C2230' },
        nebula:    { DEFAULT: '#252D3B' },
        portal:    { DEFAULT: '#39FF14', dim: '#2BD911' },
        ramen:     { DEFAULT: '#FFB347' },
        miso:      { DEFAULT: '#E8985A' },
        matcha:    { DEFAULT: '#8DB580' },
        sakura:    { DEFAULT: '#FFB7C5' },
        frost:     { DEFAULT: '#8DB5E0' },
        plasma:    { DEFAULT: '#B197FC' },
      },
      fontFamily: {
        heading: ['Chakra Petch', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { card: '16px', button: '10px', modal: '20px', pill: '9999px' },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.3)',
        glow: '0 4px 16px rgba(57,255,20,0.15)',
        elevate: '0 8px 32px rgba(0,0,0,0.5)',
        nav: '0 -4px 20px rgba(0,0,0,0.4)',
      },
    },
  },
} satisfies Config;
```

# Словарь элементов дизайна — Dimension Kitchen

Справочник UI-элементов по страницам и компонентам. Все классы соответствуют [STYLEGUIDE.md](STYLEGUIDE.md) и палитре в [src/styles/globals.css](src/styles/globals.css).

---

## Структура словаря

Для каждой страницы/компонента указаны:

- Элементы интерфейса (заголовки, карточки, кнопки, формы)
- Варианты отображения (загрузка, пустые состояния, ошибки)
- Состояния кнопок (default, hover, active, disabled, loading)
- Классы Tailwind для каждого элемента

---

## Страницы

### MenuPage (`/`)

| Элемент | Классы | Примечание |
|--------|--------|------------|
| Заголовок страницы | `font-heading text-2xl font-bold text-text-light` | Текст: «Меню недели» |
| Кнопка «Новое из шаблона» | `px-4 py-2 text-sm font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10` | Иконка `Copy` (lucide-react). Loading: `disabled:opacity-60`, текст «Создаём...» |
| Пустое состояние: заголовок | — | «Вселенная голодна 🌀» |
| Пустое состояние: подзаголовок | — | «Запланируем неделю?» |
| Пустое состояние: кнопки | Primary + Secondary | «Создать меню из шаблона», «Посмотреть рецепты» (Link `/recipes`) |
| Карточка дня | `bg-dimension border border-nebula rounded-card p-4 shadow-card` | Иконка `Calendar` + день + дата, внутри — слоты `MealSlot` |

**MealSlot (слот приёма пищи):**

| Элемент | Классы |
|--------|--------|
| Контейнер | `bg-dimension border border-nebula rounded-card p-4 shadow-card` |
| Заголовок слота | `font-heading font-semibold text-text-light mb-2` — «Завтрак» / «Обед» / «Полдник» / «Ужин» |
| Загрузка рецептов | `text-sm font-body text-text-dim` — «Загрузка рецептов...» |
| Ошибка загрузки | `text-xs font-body text-ramen` |
| Название рецепта | `text-sm font-body text-text-mid` |
| Вариация | `text-xs text-text-dim font-body` в скобках |
| Бейдж «для кого»: Коля | `bg-portal/20 text-portal` |
| Бейдж «для кого»: Кристина | `bg-ramen/20 text-ramen` |
| Бейдж «для кого»: Оба | `bg-plasma/20 text-plasma` |
| Предупреждение (нет ингредиентов) | `AlertTriangle w-4 h-4 text-ramen` + `text-xs font-body text-ramen` |
| Кнопка «Проверить ингредиенты» | `w-full mt-2 bg-rift border border-nebula text-text-light font-heading font-semibold text-xs py-2 px-3 rounded-button hover:bg-nebula hover:border-portal/30` |

**Пример карточки дня с MealSlot:**

```tsx
<div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
  <div className="flex items-center gap-2 mb-3">
    <Calendar className="w-5 h-5 text-portal" />
    <h3 className="font-heading text-xl font-bold text-text-light">Понедельник</h3>
    <span className="text-sm font-mono text-text-dim">12.02</span>
  </div>
  <div className="space-y-3">
    <MealSlot slot={slot} date={date} onUpdate={onUpdate} />
  </div>
</div>
```

---

### RecipesPage (`/recipes`)

| Элемент | Классы |
|--------|--------|
| Заголовок | `font-heading text-2xl font-bold text-text-light` — «Рецепты» / «Заготовки» |
| Подзаголовок (заготовки) | `text-text-mid font-body mb-4` — «Рецепты для заготовок выходного дня» |
| Поле поиска: контейнер | `bg-dimension border border-nebula rounded-card p-4 shadow-card` |
| Поле поиска: input | `w-full bg-rift border border-nebula rounded-button px-4 py-2 pl-10 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow` |
| Фильтр активный | `bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow` |
| Фильтр неактивный | `bg-rift border border-nebula text-text-mid hover:border-portal/30` |
| Фильтр общие размеры | `px-4 py-2 rounded-button font-heading font-semibold text-sm whitespace-nowrap` |
| Карточка рецепта | `bg-dimension border border-nebula rounded-card p-4 shadow-card hover:border-portal/30 hover:shadow-glow transition-all cursor-pointer block` |
| Пустое состояние | `text-text-mid font-body text-center` — «Рецепты не найдены» |

---

### RecipeDetailPage (`/recipe/:id`)

| Элемент | Классы |
|--------|--------|
| Заголовок рецепта | `font-heading text-3xl font-bold text-text-light mb-2` |
| Подзаголовок | `text-text-mid font-body mb-6` |
| Мета (время, порции) | `flex items-center gap-4 mb-6 text-sm font-mono text-portal`, иконки `Clock`, `Users` `w-4 h-4` |
| Секция «Ингредиенты» | `bg-dimension border border-nebula rounded-card p-5 mb-6 shadow-card` |
| Секция «Приготовление» | `bg-dimension border border-nebula rounded-card p-5 shadow-card` |
| Номер шага | `w-8 h-8 rounded-full bg-rift border border-nebula flex items-center justify-center text-sm font-heading font-semibold text-portal` |
| Совет | `text-xs text-text-dim font-body italic` + 💡 |
| Секция «Заметки» | `bg-dimension border border-nebula rounded-card p-5 mt-6 shadow-card` |

---

### ShoppingPage (`/shopping`)

| Элемент | Классы |
|--------|--------|
| Заголовок | Иконка `ShoppingCart w-6 h-6 text-portal` + `font-heading text-2xl font-bold text-text-light` |
| Прогресс-бар контейнер | `h-2 bg-rift rounded-pill overflow-hidden` |
| Прогресс-бар заполнение | `h-full bg-gradient-to-r from-portal to-portal-dim shadow-glow` |
| Карточка элемента: отмечено | `border-nebula opacity-60` |
| Карточка элемента: отсутствует | `border-ramen bg-ramen/10` |
| Карточка элемента: обычное | `border-nebula hover:border-portal/30` |
| Чекбокс | `w-5 h-5 rounded-button border-2`; активный `bg-portal border-portal`, неактивный `border-nebula hover:border-portal` |
| Кнопка «Очистить отмеченные» | Secondary, видна при `checkedCount > 0` |

---

### FreezerPage (`/freezer`)

| Элемент | Классы |
|--------|--------|
| Заголовок | Иконка `Snowflake w-6 h-6 text-frost` + «Морозилка» |
| Карточка элемента | `bg-dimension border border-nebula rounded-card p-4 shadow-card` |
| Пустое состояние | «Пустота... как в измерении без еды ❄️» |

---

### PrepPage (`/prep`)

| Элемент | Классы |
|--------|--------|
| Заголовок / описание | «Подготовка к готовке», «Выберите день для генерации плана...» |
| Поле даты | Label `block text-sm font-heading font-semibold text-text-light mb-2`, input с иконкой `Calendar` |
| PrepTaskCard: завершено | `border-nebula opacity-60` |
| PrepTaskCard: активно | `border-nebula hover:border-portal/30 hover:shadow-glow` |

---

### CookingPage (`/cooking`)

| Элемент | Классы |
|--------|--------|
| Заголовок | Иконка `ChefHat w-6 h-6 text-portal` + «Параллельная готовка» |
| Кнопка приёма активная | `border-portal bg-portal-mist shadow-glow text-portal` |
| Кнопка приёма неактивная | `border-nebula bg-rift hover:border-portal/30 text-text-mid` |
| Карточка таймера | `bg-rift border border-portal/30 rounded-card p-4 shadow-glow animate-pulse` |

---

### ChefSettingsPage (`/settings/chef`)

| Элемент | Классы |
|--------|--------|
| Заголовок | Иконка `Settings w-6 h-6 text-portal` + «Настройки режима повара» |
| Карточка настройки | `bg-dimension border border-nebula rounded-card p-5 shadow-card` |
| Toggle: активный | `bg-gradient-to-r from-portal to-portal-dim shadow-glow` |
| Toggle: неактивный | `bg-nebula` |
| Переключатель (кружок) | `inline-block h-4 w-4 rounded-full bg-void`, позиция `translate-x-6` / `translate-x-1` |
| Number input | как обычный input, `type="number" min="15" max="180" step="15"` |

---

## Общие компоненты

### BottomNav

| Элемент | Классы |
|--------|--------|
| Контейнер | `bg-dimension border-t border-nebula shadow-nav fixed bottom-0 left-0 right-0 z-50 min-h-[60px]` |
| Кнопка: активная | `text-portal` + полоска `absolute top-0 left-0 right-0 h-[3px] bg-portal shadow-glow rounded-t-full` |
| Кнопка: неактивная | `text-text-ghost` |
| Эмодзи + label | `text-xl mb-1`, `text-xs font-heading font-semibold` |

### PageShell

| Элемент | Классы |
|--------|--------|
| Header | `sticky top-0 z-50 bg-dimension border-b border-nebula shadow-nav` |
| Заголовок приложения | `font-heading text-xl font-bold text-text-light` — «SemeynoYeda» |
| Main | `min-h-screen bg-void`, класс `chef-mode` или `normal-mode` |

### IngredientCheck

| Элемент | Классы |
|--------|--------|
| Заголовок | `font-heading text-xl font-bold text-text-light mb-4` — «Проверка ингредиентов» |
| Предупреждение (недостающие) | `p-3 bg-ramen/10 border border-ramen rounded-button`, текст `text-sm font-body text-ramen` |
| Карточка: Available | `border-portal bg-portal-mist` |
| Карточка: Missing | `border-ramen bg-ramen/10` |
| Карточка: Unknown | `border-nebula bg-dimension` |
| Иконки | Available `CheckCircle2 text-portal`, Missing `XCircle text-ramen`, Unknown `HelpCircle text-text-dim` |
| Кнопки «Есть»/«Нет» | Активная «Есть» `bg-portal text-void`, «Нет» `bg-ramen text-void`; неактивные `bg-rift text-text-mid hover:bg-nebula` |
| Сообщение о завершении | `p-3 bg-portal-mist border border-portal rounded-button`, текст `text-sm font-body text-portal` — «Ингредиенты проверены, Морти» |
| Кнопка «Добавить в список покупок» | Primary, только при `missingCount > 0` |

---

## Состояния кнопок

### Primary

- Base: `px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow`
- Hover: `hover:shadow-glow/80 transition-all hover:scale-105`
- Disabled: `disabled:opacity-60`
- Loading: текст «...» или спиннер

```tsx
<button className="px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow hover:shadow-glow/80 transition-all hover:scale-105 disabled:opacity-60">
  Создать меню
</button>
```

### Secondary

- Base: `px-6 py-3 bg-rift border border-nebula text-text-light font-heading font-semibold rounded-button hover:bg-nebula transition-colors hover:border-portal/30`

### Ghost

- Base: `bg-rift border border-nebula text-text-light font-heading font-semibold text-xs py-2 px-3 rounded-button hover:bg-nebula hover:border-portal/30 transition-colors`

### Toggle Switch

- Контейнер: `relative inline-flex h-6 w-11 items-center rounded-pill transition-colors`
- Активный: `bg-gradient-to-r from-portal to-portal-dim shadow-glow`
- Неактивный: `bg-nebula`
- Кружок: `inline-block h-4 w-4 rounded-full bg-void transition-transform`, `translate-x-6` / `translate-x-1`

### Checkbox

- Контейнер: `w-5 h-5 rounded-button border-2 flex items-center justify-center transition-colors`
- Активный: `bg-portal border-portal`
- Неактивный: `border-nebula hover:border-portal`
- Иконка: `CheckCircle2 w-3 h-3 text-void`

### Filter Button

- Активная: `px-4 py-2 rounded-button font-heading font-semibold text-sm whitespace-nowrap bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow`
- Неактивная: `px-4 py-2 rounded-button font-heading font-semibold text-sm whitespace-nowrap bg-rift border border-nebula text-text-mid hover:border-portal/30`

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

## Где вносить правки

- **Цвета, шрифты, тени, скругления:** [src/styles/globals.css](src/styles/globals.css) и [tailwind.config.ts](tailwind.config.ts)
- **Полный справочник стилей и философия:** [STYLEGUIDE.md](STYLEGUIDE.md)
- **Новые элементы:** добавлять сюда в словарь и при необходимости в STYLEGUIDE.md

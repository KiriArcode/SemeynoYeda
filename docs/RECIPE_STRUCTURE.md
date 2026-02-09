# Структура рецепта

## Полная схема Recipe

```typescript
interface Recipe {
  // Основная информация
  id: string;                    // nanoid, например: "seed-kabachkovyj-sous"
  slug: string;                  // url-friendly имя: "kabachkovyj-sous"
  title: string;                 // "Кабачковый соус"
  subtitle?: string;             // "база для Коли", "для Кристины"
  
  // Классификация
  category: 'main' | 'sauce' | 'side' | 'breakfast' | 'snack' | 'soup' | 'dessert';
  tags: DietTag[];              // ['gastritis-safe', 'freezable', 'quick']
  suitableFor: FamilyMember;    // 'kolya' | 'kristina' | 'both'
  
  // Время приготовления (в минутах)
  prepTime: number;             // время подготовки
  cookTime: number;              // время готовки
  totalTime: number;             // общее время (prepTime + cookTime)
  servings: number;              // количество порций
  
  // Ингредиенты
  ingredients: Ingredient[];
  
  // Шаги приготовления
  steps: RecipeStep[];
  
  // Оборудование
  equipment: EquipmentId[];     // ['stove', 'blender']
  
  // Хранение
  storage: {
    fridge?: number;              // дней в холодильнике
    freezer?: number;             // месяцев в морозилке
    vacuumSealed?: boolean;       // упаковано вакууматором
  };
  
  // Правила разогрева (reheating instructions)
  reheating?: ReheatingInstruction[];
  
  // Дополнительно
  notes?: string;                 // заметки, советы
  version?: number;               // версия seed-рецепта для синхронизации
  source?: string;                // откуда рецепт
  imageUrl?: string;              // URL изображения
  createdAt: string;              // ISO date
  updatedAt: string;              // ISO date
}
```

## Структура Ingredient

```typescript
interface Ingredient {
  name: string;                  // "кабачок"
  amount: number;                 // 300
  unit: Unit;                    // 'г' | 'кг' | 'мл' | 'л' | 'шт' | 'ст.л.' | 'ч.л.' | 'стакан' | 'щепотка' | 'по вкусу'
  optional?: boolean;            // опциональный ингредиент
  note?: string;                 // "отварить!", "мягкий"
}
```

## Структура RecipeStep

```typescript
interface RecipeStep {
  order: number;                 // порядковый номер шага (1, 2, 3...)
  text: string;                  // описание шага
  equipment?: EquipmentUsage;    // какое оборудование используется
  duration?: number;              // минуты на этот шаг
  parallel?: boolean;             // можно делать параллельно с другим шагом
  tip?: string;                  // подсказка ("пока варится — формуйте котлеты")
}

interface EquipmentUsage {
  id: EquipmentId;               // 'stove' | 'oven' | 'steamer' | ...
  label: string;                 // "Газовая плита", "Пароварка"
  settings?: string;              // "средний огонь", "180°C", "режим пар"
  duration?: number;              // минуты работы оборудования
}
```

## Структура ReheatingInstruction

```typescript
interface ReheatingInstruction {
  forWhom: FamilyMember;         // 'kolya' | 'kristina' | 'both'
  method: string;                 // "Пароварка 25 мин", "Духовка 170°C 15 мин"
  equipment: EquipmentId;         // 'steamer' | 'oven' | 'stove' | ...
  temperature?: string;           // "170°C", "180°C" (опционально)
  duration: number;               // минуты разогрева
}
```

---

## Откуда добавляются правила готовки (reheating)?

### 1. В seed-рецептах (`src/data/seedRecipes.ts`)

Правила разогрева добавляются **напрямую в объект рецепта** при создании seed-рецепта:

```typescript
seedRecipe({
  id: SEED_RECIPE_IDS.svinoGovyazhieKotlety,
  slug: 'svino-govyazhie-kotlety',
  title: 'Свино-говяжьи котлеты',
  // ... другие поля ...
  
  // Правила разогрева добавляются здесь:
  reheating: [
    { 
      forWhom: 'kolya', 
      method: 'Пароварка 25 мин', 
      equipment: 'steamer', 
      duration: 25 
    },
    { 
      forWhom: 'kristina', 
      method: 'Духовка 170°C 15 мин', 
      equipment: 'oven', 
      temperature: '170°C', 
      duration: 15 
    },
  ],
}),
```

### 2. Через форму создания рецепта (TODO)

**Текущее состояние:** Форма `RecipeForm` (`src/components/recipe/RecipeForm.tsx`) **не поддерживает** добавление правил разогрева.

**Как добавить поддержку:**
1. Добавить состояние для `reheating` в `RecipeForm`
2. Добавить UI для добавления/редактирования правил разогрева
3. Сохранять `reheating` при создании/редактировании рецепта

### 3. Примеры из seed-рецептов

#### Пример 1: Котлеты (разные способы для Коли и Кристины)

```typescript
reheating: [
  { 
    forWhom: 'kolya', 
    method: 'Пароварка 25 мин', 
    equipment: 'steamer', 
    duration: 25 
  },
  { 
    forWhom: 'kristina', 
    method: 'Духовка 170°C 15 мин', 
    equipment: 'oven', 
    temperature: '170°C', 
    duration: 15 
  },
],
```

#### Пример 2: Суфле (пароварка для Коли, электрогриль для Кристины)

```typescript
reheating: [
  { 
    forWhom: 'kolya', 
    method: 'Пароварка 20 мин', 
    equipment: 'steamer', 
    duration: 20 
  },
  { 
    forWhom: 'kristina', 
    method: 'Электрогриль 180°C 12 мин', 
    equipment: 'e-grill', 
    temperature: '180°C', 
    duration: 12 
  },
],
```

#### Пример 3: Одинаковый способ для обоих

```typescript
reheating: [
  { 
    forWhom: 'kolya', 
    method: 'Сковорода под крышкой с водой 25-30 мин', 
    equipment: 'stove', 
    duration: 30 
  },
  { 
    forWhom: 'kristina', 
    method: 'Сковорода под крышкой с водой 25-30 мин', 
    equipment: 'stove', 
    duration: 30 
  },
],
```

---

## Правила добавления reheating

### Когда добавлять?

1. **Для замороженных блюд** (`tags: ['freezable']`) — обязательно
2. **Для блюд, которые готовятся заранее** (`tags: ['prep-day', 'batch-cooking']`) — рекомендуется
3. **Для блюд, которые хранятся в холодильнике** — опционально

### Как определять способ разогрева?

- **Коля (гастрит):** предпочтительно пароварка (`steamer`) — щадящий способ
- **Кристина:** можно использовать духовку (`oven`), электрогриль (`e-grill`) — для корочки и "богатого" вкуса
- **Оба:** одинаковый способ, обычно пароварка или плита под крышкой

### Оборудование для разогрева

| EquipmentId | Использование |
|-------------|---------------|
| `steamer` | Пароварка — щадящий способ для Коли |
| `oven` | Духовка — для корочки (Кристина) |
| `stove` | Плита — разогрев в сковороде/кастрюле |
| `e-grill` | Электрогриль — для корочки (Кристина) |
| `air-grill` | Аэрогриль — альтернатива духовке |

### Формат method

Должен быть понятным и конкретным:
- ✅ "Пароварка 25 мин"
- ✅ "Духовка 170°C 15 мин"
- ✅ "Сковорода под крышкой с водой 25-30 мин"
- ❌ "Разогреть" (слишком общо)
- ❌ "До готовности" (нет конкретного времени)

---

## Полный пример рецепта с reheating

```typescript
seedRecipe({
  id: SEED_RECIPE_IDS.svinoGovyazhieKotlety,
  slug: 'svino-govyazhie-kotlety',
  title: 'Свино-говяжьи котлеты',
  subtitle: 'заготовка',
  category: 'main',
  tags: ['gastritis-safe', 'freezable', 'prep-day', 'batch-cooking'],
  suitableFor: 'both',
  prepTime: 30,
  cookTime: 25,
  totalTime: 55,
  servings: 20,
  ingredients: [
    { name: 'свиной фарш', amount: 500, unit: 'г' },
    { name: 'говяжий фарш', amount: 500, unit: 'г' },
    { name: 'лук', amount: 200, unit: 'г' },
    { name: 'хлеб', amount: 100, unit: 'г', note: 'размоченный' },
  ],
  steps: [
    { 
      order: 1, 
      text: 'Лук мелко нарезать, обжарить до прозрачности',
      equipment: { id: 'stove', label: 'Газовая плита', settings: 'средний огонь' },
      duration: 5,
    },
    { 
      order: 2, 
      text: 'Смешать фарши, добавить лук и размоченный хлеб',
      duration: 10,
    },
    { 
      order: 3, 
      text: 'Сформировать котлеты, выложить на противень',
      duration: 15,
    },
    { 
      order: 4, 
      text: 'Запечь в духовке 180°C 25 минут',
      equipment: { id: 'oven', label: 'Духовка', settings: '180°C', duration: 25 },
      duration: 25,
    },
  ],
  equipment: ['stove', 'oven'],
  storage: { 
    fridge: 2, 
    freezer: 3, 
    vacuumSealed: true 
  },
  // Правила разогрева:
  reheating: [
    { 
      forWhom: 'kolya', 
      method: 'Пароварка 25 мин', 
      equipment: 'steamer', 
      duration: 25 
    },
    { 
      forWhom: 'kristina', 
      method: 'Духовка 170°C 15 мин', 
      equipment: 'oven', 
      temperature: '170°C', 
      duration: 15 
    },
  ],
}),
```

---

## Где используются reheating instructions?

1. **RecipeDetailPage** — отображение правил разогрева на странице рецепта
2. **FreezerItem** — правила разогрева для замороженных заготовок
3. **MealSlot** — показ времени разогрева в меню недели ("разогрев 25 мин")
4. **CookingPage** — инструкции при готовке из морозилки

---

## Резюме

**Правила готовки (reheating) добавляются:**

1. ✅ **В seed-рецептах** (`src/data/seedRecipes.ts`) — при создании seed-рецепта
2. ❌ **Через форму** — пока не реализовано (нужно добавить в `RecipeForm`)
3. ✅ **В FreezerItem** — можно переопределить при добавлении в морозилку

**Рекомендации:**
- Всегда добавляйте `reheating` для замороженных блюд (`freezable`)
- Для Коли используйте пароварку (щадящий способ)
- Для Кристины можно использовать духовку/гриль (для корочки)
- Указывайте конкретное время и температуру

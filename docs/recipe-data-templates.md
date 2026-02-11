# Шаблоны формата данных для сбора рецептов из Gemini

Используются типы и конвенции из [schema.ts](../src/data/schema.ts) и примеры из [seedRecipes.ts](../src/data/seedRecipes.ts). Ниже — готовые шаблоны для промпта в Gemini и последующей вставки в `seedRecipes.ts` или в IndexedDB.

---

## 1. Рецепт (Recipe)

Полный объект рецепта. Поля `createdAt` и `updatedAt` при добавлении через seed подставляются в коде; при добавлении через форму/API генерируются на бэкенде.

### Перечисления (строго из списка)

| Поле | Допустимые значения |
|------|---------------------|
| `category` | `'main'` \| `'sauce'` \| `'side'` \| `'breakfast'` \| `'snack'` \| `'soup'` \| `'dessert'` |
| `tags` | массив из: `'gastritis-safe'` \| `'soft-texture'` \| `'rich-feel'` \| `'freezable'` \| `'quick'` \| `'prep-day'` \| `'batch-cooking'` \| `'overnight'` \| `'packable'` \| `'low-calorie'` \| `'blanch-before-freeze'` \| `'double-coating'` |
| `suitableFor` | `'kolya'` \| `'kristina'` \| `'both'` |
| `wabbaRatings` | `null` или объект `{ "kolya"?: "like" | "dislike", "kristina"?: "like" | "dislike" }` |
| `excludedFromMenu` | `false` (по умолчанию) или `true` (оба участника свайпнули влево) |
| `unit` (в ингредиентах) | `'г'` \| `'кг'` \| `'мл'` \| `'л'` \| `'шт'` \| `'ст.л.'` \| `'ч.л.'` \| `'стакан'` \| `'щепотка'` \| `'по вкусу'` |
| `equipment` (id в шагах и массив) | `'stove'` \| `'oven'` \| `'air-grill'` \| `'e-grill'` \| `'steamer'` \| `'blender'` \| `'mixer'` \| `'grinder'` \| `'vacuum'` \| `'bowls'` |

### Шаблон JSON рецепта

```json
{
  "id": "seed-<slug>",
  "slug": "<url-friendly-latin>",
  "title": "Название блюда",
  "subtitle": "опционально: база для Коли / для Кристины / заготовка на N месяцев",
  "category": "main",
  "tags": ["gastritis-safe", "freezable"],
  "suitableFor": "both",
  "prepTime": 10,
  "cookTime": 20,
  "totalTime": 30,
  "servings": 4,
  "ingredients": [
    { "name": "ингредиент", "amount": 200, "unit": "г" },
    { "name": "соль", "amount": 1, "unit": "по вкусу", "optional": true },
    { "name": "лук", "amount": 1, "unit": "шт", "note": "отварить!" }
  ],
  "steps": [
    {
      "order": 1,
      "text": "Описание шага",
      "duration": 5,
      "equipment": {
        "id": "stove",
        "label": "Газовая плита",
        "settings": "средний огонь",
        "duration": 5
      },
      "parallel": false,
      "tip": "опционально: подсказка"
    }
  ],
  "equipment": ["stove", "blender"],
  "storage": {
    "fridge": 3,
    "freezer": 2,
    "vacuumSealed": false
  },
  "reheating": [],
  "notes": "опционально",
  "source": "опционально",
  "imageUrl": "опционально",
  "wabbaRatings": null,
  "excludedFromMenu": false
}
```

Конвенция id/slug (как в [parse-recipes.mdc](../.cursor/rules/parse-recipes.mdc)): из названия «Медово-горчичный соус» → `id: "seed-medovo-gorchichnyj-sous"`, `slug: "medovo-gorchichnyj-sous"`.

---

## 2. Инструкции (шаги рецепта и разогрев)

### 2.1 Шаг рецепта (RecipeStep)

Используется внутри `recipe.steps[]`.

```json
{
  "order": 1,
  "text": "Текстовое описание шага",
  "duration": 10,
  "equipment": {
    "id": "stove",
    "label": "Газовая плита",
    "settings": "средний огонь",
    "duration": 10
  },
  "parallel": false,
  "tip": "Пока варится — можно сделать X"
}
```

- `equipment`, `duration`, `parallel`, `tip` — опциональны.
- `equipment.id` — только из списка EquipmentId выше.
- `equipment.label` — человекочитаемое название («Духовка», «Пароварка», «Блендер»).

### 2.2 Инструкция разогрева (ReheatingInstruction)

Используется в `recipe.reheating[]` (и в `FreezerItem.reheating`).

```json
{
  "forWhom": "kolya",
  "method": "Пароварка 25 мин",
  "equipment": "steamer",
  "temperature": "180°C",
  "duration": 25
}
```

- `forWhom`: `"kolya"` \| `"kristina"` \| `"both"` (в схеме тип FamilyMember; для разогрева обычно указывают отдельно для кого способ).
- `equipment`: один из EquipmentId (`steamer`, `oven`, `stove` и т.д.).
- `temperature` — опционально.

---

## 3. Заготовки

В приложении «заготовки» встречаются в двух видах:

1. **Рецепт-заготовка** — обычный рецепт с тегами `prep-day`, `freezable` и т.п.; формат тот же, что и у обычного рецепта (п. 1). Примеры: свино-говяжьи котлеты, куриные котлеты в [seedRecipes.ts](../src/data/seedRecipes.ts).
2. **План подготовки на день (PrepPlan)** и **задачи подготовки (PrepTask)** — генерируются в приложении из рецептов ([usePrepPlan.ts](../src/hooks/usePrepPlan.ts)), вручную или из внешней системы не обязательны для «сбора рецептов из Gemini».

Для сбора рецептов из Gemini достаточно шаблона **рецепта** (п. 1). Если нужно отдельно описать «заготовку» — это тот же рецепт с примером ниже.

### Шаблон рецепта-заготовки (для Gemini)

Тот же JSON, что в п. 1, с акцентом на поля:

- `tags`: обязательно включить `"prep-day"` и при возможности `"freezable"`.
- `subtitle`: например `"заготовка на 3 месяца"`.
- `servings`: часто больше (10–20 порций).
- `storage.freezer`, `storage.vacuumSealed`: заполнять по смыслу.
- `reheating`: массив инструкций разогрева для каждого члена семьи, если блюдо замораживается.

Пример минимального фрагмента:

```json
{
  "title": "Свино-говяжьи котлеты",
  "subtitle": "заготовка на 3 месяца",
  "category": "main",
  "tags": ["freezable", "soft-texture", "prep-day"],
  "suitableFor": "both",
  "servings": 20,
  "storage": { "fridge": 2, "freezer": 3, "vacuumSealed": true },
  "reheating": [
    { "forWhom": "kolya", "method": "Пароварка 25 мин", "equipment": "steamer", "duration": 25 },
    { "forWhom": "kristina", "method": "Духовка 170°C 15 мин", "equipment": "oven", "temperature": "170°C", "duration": 15 }
  ]
}
```

Остальные поля — как в полном шаблоне рецепта (id, slug, ingredients, steps, equipment, prepTime, cookTime, totalTime и т.д.).

---

## Итоговая структура для промпта Gemini

1. **Один рецепт** — отдавать в Gemini полный шаблон из п. 1 и просить вернуть JSON в этой структуре (с русскими названиями и корректными enum).
2. **Инструкции** — объяснить Gemini формат шага (п. 2.1) и разогрева (п. 2.2); можно просить возвращать `steps` и `reheating` сразу внутри объекта рецепта.
3. **Заготовки** — использовать тот же шаблон рецепта (п. 1) с подсказкой по тегам и полям из п. 3.

Дальнейшее добавление в базу: либо ручная вставка в `getSeedRecipes()` в [seedRecipes.ts](../src/data/seedRecipes.ts) с вызовом `seedRecipe({...})` и добавлением id в `SEED_RECIPE_IDS`, либо импорт JSON через компонент импорта (см. [RECIPE_IMPORT_GUIDE.md](./RECIPE_IMPORT_GUIDE.md)) с автоматической проверкой дубликатов.

**Примечание:** Поля `wabbaRatings` и `excludedFromMenu` добавляются автоматически через интерфейс Wabba (`/wabba`) и обычно не указываются вручную при создании рецептов.

---

## Промпт для AI инструментов (Gemini/Claude)

Используйте следующий промпт для генерации рецептов в нужном формате:

```
Создай рецепты в формате JSON со следующей структурой:

{
  "id": "seed-<slug>",
  "slug": "<url-friendly-latin>",
  "title": "Название блюда",
  "subtitle": "опционально",
  "category": "main|sauce|side|breakfast|snack|soup|dessert",
  "tags": ["gastritis-safe", "freezable", ...],
  "suitableFor": "kolya|kristina|both",
  "prepTime": <минуты>,
  "cookTime": <минуты>,
  "totalTime": <минуты>,
  "servings": <количество>,
  "ingredients": [
    {
      "name": "название ингредиента",
      "amount": <число>,
      "unit": "г|кг|мл|л|шт|ст.л.|ч.л.|стакан|щепотка|по вкусу",
      "optional": true/false,
      "note": "опционально"
    }
  ],
  "steps": [
    {
      "order": <номер>,
      "text": "описание шага",
      "duration": <минуты>,
      "equipment": {
        "id": "stove|oven|air-grill|e-grill|steamer|blender|mixer|grinder|vacuum|bowls",
        "label": "человекочитаемое название",
        "settings": "настройки",
        "duration": <минуты>
      },
      "parallel": true/false,
      "tip": "опционально"
    }
  ],
  "equipment": ["stove", "blender", ...],
  "storage": {
    "fridge": <дней>,
    "freezer": <месяцев>,
    "vacuumSealed": true/false
  },
  "reheating": [
    {
      "forWhom": "kolya|kristina|both",
      "method": "способ разогрева",
      "equipment": "steamer|oven|stove|...",
      "temperature": "опционально",
      "duration": <минуты>
    }
  ],
  "notes": "опционально",
  "source": "опционально"
}

ВАЖНО:
- Для каждого шага укажи время приготовления (duration)
- Если блюдо можно заморозить, обязательно добавь тег "freezable" и укажи метод заморозки в storage.freezer
- Если блюдо требует заготовки компонентов (соусы, основы), укажи это в notes
- Для замороженных блюд обязательно добавь reheating инструкции для каждого члена семьи
- Время готовки (cookTime) должно быть суммой всех duration в steps
- prepTime - время подготовки ингредиентов без использования плиты/духовки
- Если используется техника "двойное покрытие" (сначала бланширование в молоке для удаления запаха, затем готовка с соусом), добавь тег "double-coating"
```

---

## Массовый импорт JSON рецептов

Для массового импорта нескольких рецептов используйте массив JSON объектов:

```json
[
  {
    "id": "seed-recipe-1",
    "slug": "recipe-1",
    "title": "Рецепт 1",
    ...
  },
  {
    "id": "seed-recipe-2",
    "slug": "recipe-2",
    "title": "Рецепт 2",
    ...
  }
]
```

При импорте система автоматически проверяет дубликаты по полям `title` или `slug`. Если рецепт с таким названием или slug уже существует, импорт будет пропущен с предупреждением.

**Проверка дубликатов:**
- Рецепт считается дубликатом, если его `title` точно совпадает с существующим рецептом ИЛИ
- Его `slug` точно совпадает с существующим рецептом
- При обнаружении дубликата рецепт не будет добавлен, но процесс импорта продолжится для остальных рецептов

# План: генерация меню и план заготовок (обновлённый)

Уточнённые требования: два варианта генерации меню (несколько шаблонов / случайная из базы), расчёт порций по forWhom, заготовки на неделю и обязательные бульоны по 1 л. **Обязательное требование:** шаблон всегда генерирует меню на полную неделю, включая субботу и воскресенье (7 дней, все приёмы заполнены или явно помечены).

---

## План работ (порядок выполнения)

| № | Задача | Файлы | Зависимости |
|---|--------|--------|-------------|
| **1** | **Порции по forWhom** — хелпер и расчёт списка покупок / заготовок | [src/lib/shoppingListUtils.ts](src/lib/shoppingListUtils.ts), [src/hooks/useShoppingList.ts](src/hooks/useShoppingList.ts), [src/hooks/useBatchCooking.ts](src/hooks/useBatchCooking.ts) | — |
| 1.1 | Добавить `getPortionsPerRecipeFromMenu(weekMenu)` с логами | shoppingListUtils.ts | — |
| 1.2 | В `generateShoppingList`: порции по меню, multiplier, масштаб ингредиентов + логи | useShoppingList.ts | 1.1 |
| 1.3 | В `generateBatchPlan`: нужные порции = menuPortions − freezerStock + логи | useBatchCooking.ts | 1.1 |
| **2** | **Подсказка «генерация только при интернете»** | [src/pages/MenuPage.tsx](src/pages/MenuPage.tsx) | — |
| 2.1 | Текст подсказки рядом с кнопкой(ами) генерации меню | MenuPage.tsx | — |
| 2.2 | `disabled` кнопок при `!navigator.onLine` (и при необходимости при отсутствии VITE_API_URL) | MenuPage.tsx | — |
| **3** | **Обновление UI после создания меню** | MenuPage.tsx, при необходимости MealSlot | — |
| 3.1 | Убедиться, что после create вызывается `loadWeekMenu()` и в state попадает новое меню | MenuPage.tsx | — |
| 3.2 | Ключи по `weekMenu.id` для списка дней/слотов, чтобы MealSlot перезапрашивал рецепты | MenuPage.tsx | — |
| **4** | **Шаблоны меню на полную неделю (включая выходные)** | seedMenu.ts или menuTemplates.ts, MenuPage.tsx | — |
| 4.1 | Несколько шаблонов (конфиг или функции) с разными наборами блюд; каждый шаблон возвращает меню на 7 дней | src/data/ | — |
| 4.2 | Требование: шаблон всегда генерирует меню на неделю **включая Сб и Вс** (все 7 дней с заполненными или помеченными приёмами) | seedMenu / menuTemplates | — |
| 4.3 | UI выбора шаблона (селект или кнопки) перед созданием меню | MenuPage.tsx | 4.1, 4.2 |
| **5** | **Генерация «Из базы»** | новый menuFromRecipes.ts, MenuPage.tsx | — |
| 5.1 | Модуль: случайная сборка WeekMenu из `dataService.recipes.list()`, 7 дней, ограничение дубликатов | src/lib/menuFromRecipes.ts | — |
| 5.2 | Кнопка «Из базы» и вызов генерации, затем create + loadWeekMenu | MenuPage.tsx | 5.1 |
| **6** | **Бульоны по 1 л в плане заготовок** | useBatchCooking.ts, при необходимости schema | 1 |
| 6.1 | Определение бульонов (категория soup / название «бульон») | useBatchCooking.ts | — |
| 6.2 | После задач из меню добавить по одной задаче «1 л [бульон]» на каждый тип бульона | useBatchCooking.ts | 6.1 |
| **7** | **Баннеры и ссылки после создания меню** | MenuPage.tsx, PrepPage.tsx | — |
| 7.1 | Баннер «Меню создано. Обновить список покупок и план заготовок» со ссылками | MenuPage.tsx | — |
| 7.2 | На PrepPage: баннер «Меню изменилось. Пересоздать план заготовок» при устаревшем плане | PrepPage.tsx | — |

**Рекомендуемая очерёдность:** 1 → 2 → 3 → 4 → 5 → 6 → 7. Задачи 2 и 3 можно выполнять параллельно с 1. Конкретные патчи для шага 1 — в разделе 10 ниже.

---

## 1. Генерация меню

### 1.1 Вариант «Из шаблона»

- **Требование:** шаблон **всегда генерирует меню на полную неделю, включая выходные** — 7 дней (Пн–Вс), все приёмы либо заполнены рецептами, либо явно помечены (например «повтор», «разморозка»). Пустые Сб/Вс не допускаются.
- **Сейчас:** один шаблон в [getSeedWeekMenu](src/data/seedMenu.ts) (Пн–Пт заполнены фиксированными SEED_RECIPE_IDS, Сб–Вс пустые) — привести в соответствие с требованием.
- **Доработки:**
  - Добавить **несколько готовых шаблонов** с разными наборами блюд (например: «Классическая неделя», «Лёгкая», «Разнообразная»). Каждый шаблон — функция или конфиг, возвращающая **меню на 7 дней** (включая Сб и Вс) с заполненными или помеченными приёмами.
  - Для Сб и Вс задать конкретные приёмы и рецепты (или слоты с пометкой «повтор/разморозка» при необходимости).
- Файлы: [src/data/seedMenu.ts](src/data/seedMenu.ts) (или новый `src/data/menuTemplates.ts`), [src/pages/MenuPage.tsx](src/pages/MenuPage.tsx) — выбор шаблона (селект или кнопки) перед созданием.

### 1.2 Вариант «Из базы»

- **Случайная генерация** меню из рецептов базы (`dataService.recipes.list()`).
  - Правила: фильтр по `excludedFromMenu !== true`, при необходимости по категориям и приёмам (breakfast/snack → подходящие категории и т.д.).
  - Заполнять все 7 дней и все приёмы (в т.ч. Сб и Вс) случайно выбранными рецептами с ограничением дубликатов (например, один рецепт не чаще N раз за неделю).
- Файлы: новый модуль `src/lib/menuFromRecipes.ts` (или в `src/data/`), вызов из MenuPage по кнопке «Из базы».

### 1.3 Логика порций по forWhom

- **Заложить в расчёты по меню и заготовкам:**
  - Слот меню с **forWhom: 'kolya'** → считать **1 порция**.
  - Слот с **forWhom: 'kristina'** → **1 порция**.
  - Слот с **forWhom: 'both'** → **2 порции**.
- Где применять:
  - **Список покупок:** при агрегации ингредиентов по меню считать количество порций рецепта не как `recipe.servings * число_слотов`, а как сумму порций по слотам: для каждого вхождения рецепта в меню прибавлять 1 (kolya/kristina) или 2 (both), затем масштабировать ингредиенты рецепта на (сумма_порций / recipe.servings). Файлы: [src/hooks/useShoppingList.ts](src/hooks/useShoppingList.ts), при необходимости [src/lib/shoppingListUtils.ts](src/lib/shoppingListUtils.ts).
  - **План заготовок (BatchPlan):** нужное количество порций блюда для заморозки считать так же: по каждому слоту меню, где встречается рецепт, прибавлять 1 или 2 порции в зависимости от forWhom; вычесть уже имеющееся в морозилке. Файлы: [src/hooks/useBatchCooking.ts](src/hooks/useBatchCooking.ts) — заменить или дополнить расчёт `recipeUsageCount` на «сумма порций по forWhom» и `neededPortions` считать от этой суммы.

---

## 2. Заготовки (план и продукты на неделю)

### 2.1 Формирование плана и расчёт продуктов на неделю

- **План заготовок** формировать и считать количество продуктов **на всю неделю** (текущее меню на 7 дней), а не на один день.
  - Уже так: [useBatchCooking](src/hooks/useBatchCooking.ts) берёт `weekMenu`, собирает все recipeId по дням/приёмам, считает usage и порции. Нужно убедиться, что учёт порций по forWhom (п. 1.3) и расчёт объёмов ингредиентов везде опираются на недельное меню.
  - Список покупок: [useShoppingList](src/hooks/useShoppingList.ts) уже агрегирует ингредиенты по всему меню; при введении порций по forWhom (п. 1.3) объёмы автоматически станут «на неделю».

### 2.2 Бульоны: по 1 л каждого в плане

- **В плане заготовок всегда включать задачи на 1 л каждого типа бульона.**
  - Определение бульона: рецепты с категорией `soup` или в названии/тегах «бульон» (или отдельный тег/флаг в схеме, если появится). Список таких рецептов получать из `dataService.recipes.list()`.
  - Для каждого уникального «бульона» (по recipeId) добавить в план заготовок задачу: «Сварить 1 л [название бульона]» (или эквивалент по шагам рецепта) с объёмом 1 л, **независимо от того, сколько раз этот бульон входит в меню**. То есть минимум 1 л в плане всегда.
  - Реализация: в [useBatchCooking](src/hooks/useBatchCooking.ts) после формирования задач из меню (уровни 1–3 и морозилка) получить все рецепты-бульоны, для каждого добавить задачу «1 л бульона» (и при необходимости шаги из рецепта с масштабом на 1 л), если такой задачи ещё нет. Порции для этих задач фиксированы: 1 л (или 1 порция, если в рецепте порции заданы в литрах).

---

## 3. Обновление списка рецептов на экране и связанные списки

- После создания меню (из шаблона или из базы): вызывать `loadWeekMenu()`, использовать в ключах React `weekMenu.id`, чтобы слоты (MealSlot) перезапросили рецепты. При необходимости передавать `menuId` в MealSlot для явного refetch.
- После генерации меню показывать баннер: «Меню создано. [Обновить список покупок](/shopping) и [план заготовок](/prep).»
- На PrepPage: если меню изменилось (weekStart/updatedAt новее сохранённого плана), показывать: «Меню изменилось. [Пересоздать план заготовок].»

---

## 4. Порядок внедрения

1. **Порции по forWhom** (п. 1.3) в useBatchCooking и useShoppingList — база для корректных объёмов.
2. **Шаблоны на полную неделю** (п. 1.1): несколько шаблонов; каждый шаблон генерирует меню на 7 дней, включая выходные (Сб и Вс).
3. **Генерация из базы** (п. 1.2): случайная сборка меню на 7 дней.
4. **Бульоны по 1 л** (п. 2.2) в плане заготовок.
5. **Баннеры и ссылки** (п. 3) после создания меню и на PrepPage.

---

## 5. Файлы для правок

| Задача | Файлы |
|--------|--------|
| Шаблоны на полную неделю (включая выходные) | [src/data/seedMenu.ts](src/data/seedMenu.ts), новый конфиг/модуль шаблонов, [MenuPage](src/pages/MenuPage.tsx) |
| Из базы | новый `src/lib/menuFromRecipes.ts`, [MenuPage](src/pages/MenuPage.tsx) |
| Порции forWhom | [src/hooks/useShoppingList.ts](src/hooks/useShoppingList.ts), [src/hooks/useBatchCooking.ts](src/hooks/useBatchCooking.ts), при необходимости [src/lib/shoppingListUtils.ts](src/lib/shoppingListUtils.ts) |
| Бульоны 1 л | [src/hooks/useBatchCooking.ts](src/hooks/useBatchCooking.ts), возможно [src/data/schema.ts](src/data/schema.ts) при введении признака бульона |
| Баннеры/ссылки | [src/pages/MenuPage.tsx](src/pages/MenuPage.tsx), [src/pages/PrepPage.tsx](src/pages/PrepPage.tsx) |

---

## 6. Следующий шаг в коде (детально)

Рекомендуемый первый шаг: **логика порций по forWhom** (п. 1.3). От неё зависят корректный список покупок и план заготовок.

### 6.1 Общий хелпер «порции по меню»

- **Файл:** [src/lib/shoppingListUtils.ts](src/lib/shoppingListUtils.ts) (или новый `src/lib/menuPortions.ts`).
- **Функция:** `getPortionsPerRecipeFromMenu(weekMenu: WeekMenu): Map<string, number>`.
  - Обход: `weekMenu.days` → `day.meals` → `meal.recipes`; для каждого `{ recipeId, forWhom }` прибавить к счётчику по `recipeId`: 1 при `forWhom === 'kolya'` или `'kristina'`, 2 при `forWhom === 'both'`.
  - Вернуть `Map<recipeId, totalPortions>`.
- Экспорт и использование в useShoppingList и useBatchCooking.

### 6.2 useShoppingList

- Сейчас: по каждому `recipeId` из меню рецепт попадает в `recipesMap` один раз, затем `recipe.ingredients` суммируются как есть (без масштаба по порциям).
- **Изменить:** перед циклом по `recipesMap` вычислить `const portionsByRecipe = getPortionsPerRecipeFromMenu(weekMenu)`. В цикле по `recipe.ingredients` считать коэффициент: `const multiplier = (portionsByRecipe.get(recipe.id) ?? 1) / recipe.servings`; в `totalAmount` добавлять `ingredient.amount * multiplier` (при объединении по ключу ингредиент+единица складывать уже масштабированные значения).
- Учесть морозилку и `usesFromFreezer` по текущей логике; порции влияют только на объём ингредиентов.

### 6.3 useBatchCooking

- Сейчас: `recipeUsageCount` — число слотов меню с этим рецептом; `neededPortions = recipe.servings * usageCount - freezerStock`.
- **Изменить:** заменить на «порции по forWhom»: `const portionsByRecipe = getPortionsPerRecipeFromMenu(weekMenu)`; для каждого рецепта `neededPortions = (portionsByRecipe.get(recipe.id) ?? 0) - (freezerStock.get(recipe.id) ?? 0)`, не меньше 0. Дальше генерация задач и `recipeUsageByMember` оставить, но расчёт порций для упаковки брать из `neededPortions` (уже в порциях по 1/2).

### 6.4 Проверки

- Unit- или ручные проверки: меню с одним рецептом «both» на 4 порции в рецепте → 2 порции в расчёте; два слота «kolya» + один «kristina» → 3 порции; список покупок и план заготовок должны давать объёмы пропорционально этим порциям.

---

## 7. Проверка API: поддержка решения

Текущие методы API **позволяют** реализовать план без изменений бэкенда.

| Сущность | Методы | Вывод |
|----------|--------|--------|
| **Меню** | `GET /api/data/menus` (getCurrent), `POST /api/data/menus` (create), `PUT /api/data/menus/:id` (update). Тело: WeekMenu с `days` (JSONB). | Создание/обновление меню с любыми днями и слотами (Пн–Вс, recipeId, forWhom) уже поддерживается. Доп. полей не требуется. |
| **Рецепты** | `GET /api/data/recipes` (list, опционально category, tags). | Для «Из базы» достаточно list() без фильтров (или с фильтрами). Полный список рецептов для случайной генерации и для бульонов есть. |
| **Покупки** | `GET/POST/PUT/DELETE /api/shopping`, по id — PATCH/DELETE. | Список покупок строится на клиенте из меню и рецептов; API только сохраняет/читает элементы. Порции по forWhom — только клиентский расчёт. |
| **PrepPlan** | `GET /api/prep-plans?date=`, POST, PUT, DELETE. | Используется для PrepPlan (подготовка ингредиентов). План заготовок (BatchPlan) хранится только в IndexedDB, API для него не нужен. |

**Итог:** новые сценарии (несколько шаблонов, генерация из базы, порции по forWhom, бульоны в плане) реализуются на фронте и в существующих вызовах API. Новые эндпоинты не требуются.

---

## 8. Подсказка «Генерация меню только при наличии интернета»

- **Где:** [src/pages/MenuPage.tsx](src/pages/MenuPage.tsx), в блоке с кнопками генерации меню (и «Из шаблона», и «Из базы»).
- **Что сделать:**
  - Показывать подсказку рядом с кнопками: текст вида «Генерация меню доступна только при наличии интернета» (или «Генерация меню возможна только при подключении к интернету»).
  - При отсутствии интернета **отключать** кнопки создания меню: `disabled={creatingFromTemplate || !navigator.onLine}` (и аналог для «Из базы»). Опционально: учитывать наличие API — `const canGenerate = navigator.onLine && (import.meta.env.VITE_API_URL ?? '') !== ''` — если генерация должна идти только при настроенном бэкенде.
  - Размещение: под рядом кнопок или над ними, стиль — приглушённый текст (например `text-text-muted text-xs`), можно с иконкой (например Wifi или CloudOff).
- Так пользователь явно видит ограничение и не получает пустую ошибку при офлайне.

---

## 9. IndexedDB и новые требования

Проверка схемы и использования Dexie: **новые требования не требуют изменений схемы IndexedDB.**

| Требование | Хранение в IDB | Нужна ли миграция |
|------------|-----------------|--------------------|
| Несколько шаблонов меню | Шаблоны — конфиг/код (seedMenu или menuTemplates), не хранятся в IDB. В IDB пишется только результат — один объект WeekMenu (таблица `menus`). | Нет. |
| Меню с Сб/Вс | WeekMenu.days — массив из 7 элементов; структура уже поддерживается. Добавление заполненных слотов для Сб/Вс — только содержимое `days`, без новых полей. | Нет. |
| Порции по forWhom | В меню уже есть `forWhom` в каждом слоте. Расчёт порций выполняется в коде при генерации списка покупок и плана заготовок; в IDB хранятся только итоговые ShoppingItem (totalAmount и т.д.) и BatchPlan (tasks с portions). | Нет. |
| Бульоны по 1 л в плане | BatchPlan.tasks — массив BatchTask. Добавление задач «1 л бульона» — новые элементы в массиве, тип BatchTask уже поддерживает step, portions, recipeId. При необходимости для бульона можно задать portions = 1 и step с текстом «1 л». | Нет. |
| Генерация только при интернете | Не влияет на структуру IDB; влияет только на UI (disabled, подсказка). Чтение/запись меню через dataService по-прежнему идёт в IDB (offline-first), но **создание** нового меню при генерации можно ограничить условием «онлайн». | Нет. |

**Итог:** текущие таблицы `menus`, `shoppingById`, `batchPlans`, `prepPlans` и типы WeekMenu, ShoppingItem, BatchPlan, BatchTask из [schema](src/data/schema.ts) достаточны. Миграции Dexie не нужны; все доработки — логика в хуках и утилитах.

---

## 10. Конкретные патчи с console.log для отладки

Ниже — готовые фрагменты кода для вставки/замены. В каждом действии добавлен `console.log` для отладки.

### 10.1 Новый хелпер в shoppingListUtils.ts

**Файл:** [src/lib/shoppingListUtils.ts](src/lib/shoppingListUtils.ts)

**В начало файла** (после существующих импортов) добавить импорт типа и саму функцию:

```ts
import type { WeekMenu } from '../data/schema';

/**
 * Считает суммарные порции по рецептам из меню по правилу forWhom:
 * kolya / kristina → 1 порция, both → 2 порции.
 */
export function getPortionsPerRecipeFromMenu(weekMenu: WeekMenu): Map<string, number> {
  const map = new Map<string, number>();
  console.log('[getPortionsPerRecipeFromMenu] start', { daysCount: weekMenu.days?.length ?? 0 });
  weekMenu.days.forEach((day, dayIdx) => {
    day.meals.forEach((meal) => {
      meal.recipes.forEach((entry) => {
        const add = entry.forWhom === 'both' ? 2 : 1;
        const prev = map.get(entry.recipeId) ?? 0;
        map.set(entry.recipeId, prev + add);
        console.log('[getPortionsPerRecipeFromMenu] slot', {
          day: day.date,
          meal: meal.mealType,
          recipeId: entry.recipeId,
          forWhom: entry.forWhom,
          add,
          total: prev + add,
        });
      });
    });
  });
  console.log('[getPortionsPerRecipeFromMenu] result', Object.fromEntries(map));
  return map;
}
```

(Если не хочется импортировать схему из `lib`, хелпер можно вынести в `src/lib/menuPortions.ts` и импортировать там `WeekMenu` из `../data/schema`.)

---

### 10.2 Патч useShoppingList.ts

**Файл:** [src/hooks/useShoppingList.ts](src/hooks/useShoppingList.ts)

**1) Добавить импорт** вверху:

```ts
import { applyMinWeightOrVolume, getPortionsPerRecipeFromMenu } from '../lib/shoppingListUtils';
```

**2) Заменить блок** от «const recipeIds = new Set» до конца цикла «recipesMap.forEach» на следующий (внутри `generateShoppingList`):

```ts
    const recipeIds = new Set<string>();
    weekMenu.days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.recipes.forEach((recipe) => {
          recipeIds.add(recipe.recipeId);
        });
      });
    });
    console.log('[generateShoppingList] recipeIds from menu', Array.from(recipeIds));

    const portionsByRecipe = getPortionsPerRecipeFromMenu(weekMenu);

    const allRecipes = await dataService.recipes.list();
    allRecipes.forEach((recipe) => {
      if (recipeIds.has(recipe.id)) recipesMap.set(recipe.id, recipe);
    });
    console.log('[generateShoppingList] recipesMap size', recipesMap.size);

    recipesMap.forEach((recipe) => {
      const totalPortions = portionsByRecipe.get(recipe.id) ?? 1;
      const multiplier = totalPortions / recipe.servings;
      console.log('[generateShoppingList] recipe portions', {
        recipeId: recipe.id,
        title: recipe.title,
        servings: recipe.servings,
        totalPortions,
        multiplier,
      });
      recipe.ingredients.forEach((ingredient) => {
        const key = `${ingredient.name}_${ingredient.unit}`;
        const amount = ingredient.amount * multiplier;
        const existing = ingredientMap.get(key);

        if (existing) {
          existing.totalAmount += amount;
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeIds.push(recipe.id);
          }
          console.log('[generateShoppingList] merge ingredient', { key, amount, newTotal: existing.totalAmount });
        } else {
          ingredientMap.set(key, {
            id: crypto.randomUUID(),
            ingredient: ingredient.name,
            totalAmount: amount,
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            checked: false,
            recipeIds: [recipe.id],
            markedMissing: false,
            source: 'auto',
          });
          console.log('[generateShoppingList] new ingredient', { key, amount });
        }
      });
    });
```

Остальная часть `generateShoppingList` (freezer, usesFromFreezer, missingIngredients, return с `applyMinWeightOrVolume`) без изменений.

---

### 10.3 Патч useBatchCooking.ts

**Файл:** [src/hooks/useBatchCooking.ts](src/hooks/useBatchCooking.ts)

**1) Добавить импорт** вверху:

```ts
import { getPortionsPerRecipeFromMenu } from '../lib/shoppingListUtils';
```

**2) Заменить блок расчёта порций** (секция «5. Calculate needed portions» и начало «6. Generate tasks»). Найти:

```ts
      // 5. Calculate needed portions and portions by member (for personalized packets)
      const recipeUsageCount = new Map<string, number>();
      const recipeUsageByMember = new Map<string, { kolya: number; kristina: number }>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            const rid = entry.recipeId;
            recipeUsageCount.set(rid, (recipeUsageCount.get(rid) || 0) + 1);
            const byMember = recipeUsageByMember.get(rid) || { kolya: 0, kristina: 0 };
            if (entry.forWhom === 'kolya') byMember.kolya += 1;
            else if (entry.forWhom === 'kristina') byMember.kristina += 1;
            else if (entry.forWhom === 'both') {
              byMember.kolya += 1;
              byMember.kristina += 1;
            }
            recipeUsageByMember.set(rid, byMember);
          }
        }
      }

      // 6. Generate tasks
      const tasks: BatchTask[] = [];
      for (const recipe of prepRecipesArray) {
        const usageCount = recipeUsageCount.get(recipe.id) || 1;
        const stockPortions = freezerStock.get(recipe.id) || 0;
        const neededPortions = Math.max(0, recipe.servings * usageCount - stockPortions);
```

Заменить на:

```ts
      // 5. Portions by forWhom (kolya/kristina = 1, both = 2) and by member for packets
      const portionsByRecipe = getPortionsPerRecipeFromMenu(weekMenu);
      console.log('[useBatchCooking] portionsByRecipe', Object.fromEntries(portionsByRecipe));

      const recipeUsageByMember = new Map<string, { kolya: number; kristina: number }>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            const rid = entry.recipeId;
            const byMember = recipeUsageByMember.get(rid) || { kolya: 0, kristina: 0 };
            if (entry.forWhom === 'kolya') byMember.kolya += 1;
            else if (entry.forWhom === 'kristina') byMember.kristina += 1;
            else if (entry.forWhom === 'both') {
              byMember.kolya += 1;
              byMember.kristina += 1;
            }
            recipeUsageByMember.set(rid, byMember);
          }
        }
      }
      console.log('[useBatchCooking] recipeUsageByMember (slots)', Array.from(recipeUsageByMember.entries()).map(([id, m]) => ({ id, ...m })));

      // 6. Generate tasks
      const tasks: BatchTask[] = [];
      for (const recipe of prepRecipesArray) {
        const menuPortions = portionsByRecipe.get(recipe.id) ?? 0;
        const stockPortions = freezerStock.get(recipe.id) || 0;
        const neededPortions = Math.max(0, menuPortions - stockPortions);
        console.log('[useBatchCooking] portions', {
          recipeId: recipe.id,
          title: recipe.title,
          menuPortions,
          stockPortions,
          neededPortions,
        });
```

Дальше в том же цикле: проверка `if (neededPortions <= 0)` и создание задач остаются как есть (используется уже новый `neededPortions`). Переменная `usageCount` больше не нужна; `recipeUsageByMember` по-прежнему используется для `portionsByMember` при упаковке.

---

### 10.4 Порядок применения

1. Добавить в [src/lib/shoppingListUtils.ts](src/lib/shoppingListUtils.ts) импорт `WeekMenu` и функцию `getPortionsPerRecipeFromMenu` с логами (п. 10.1).
2. В [src/hooks/useShoppingList.ts](src/hooks/useShoppingList.ts) — импорт хелпера и замена агрегации ингредиентов на расчёт с `portionsByRecipe` и `multiplier` (п. 10.2).
3. В [src/hooks/useBatchCooking.ts](src/hooks/useBatchCooking.ts) — импорт хелпера и замена расчёта порций на `portionsByRecipe` и `neededPortions = menuPortions - stockPortions` (п. 10.3).

После применения: генерация списка покупок и плана заготовок выведет в консоль порции по рецептам и по каждому слоту/ингредиенту для отладки. Когда отладка не нужна, логи можно заменить на `logger.log` или удалить.

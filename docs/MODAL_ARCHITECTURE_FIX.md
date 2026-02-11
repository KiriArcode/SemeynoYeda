# Проблема модальных окон: SwapModal не открывается

## Симптомы

1. **Иконка swap (ArrowLeftRight)** в `MealSlot` — по клику модальное окно замены блюда не открывается.
2. **Кнопка** по XPath вида `.../main/div[2]/div[4]/div[1]/button[5]` — модальное окно для неё тоже не вызывается (если это кнопка, которая должна открывать модалку).

## Текущая реализация

- **Modal** ([src/components/ui/Modal.tsx](src/components/ui/Modal.tsx)): при `isOpen === true` рендерит разметку через `createPortal(modal, document.body)`, z-index 9999.
- **SwapModal** рендерится **внутри** [MealSlot](src/components/menu/MealSlot.tsx): состояние `swapIndex` (number | null) хранится в каждом экземпляре MealSlot. При клике по кнопке «Заменить блюдо» вызывается `handleSwapRecipe` → `setSwapIndex(index)` → при `swapIndex !== null` рендерится `<SwapModal isOpen={true} ... />`.

Возможные причины, почему модалка не показывается:

1. **Клик не доходит до кнопки** — перехват события родителем (например, область аккордеона или контейнер с `overflow-hidden`), на мобильных — интерпретация как скролл/другой жест.
2. **Состояние не обновляется / компонент размонтируется** — при обновлении состояния родитель может перерисовываться так, что MealSlot пересоздаётся (например, нестабильный key) и локальный `swapIndex` сбрасывается.
3. **Портал рендерится, но не виден** — один и тот же z-index (9999) у `PortalTransitionOverlay` в [PortalTransitionContext](src/contexts/PortalTransitionContext.tsx) (у overlay стоит `pointer-events-none`, так что он не должен перекрывать клики); возможны конфликты stacking context, если у предка модалки есть `transform`/`filter` (но портал рендерится в `body`, так что предки — только body и root).
4. **Много экземпляров модалки** — на странице десятки MealSlot (7 дней × 6 приёмов). В каждом при открытии swap рендерится свой SwapModal. Теоретически только один из них должен иметь `swapIndex !== null`, но размонтирование/ремонт дерева при скролле или при смене фильтра могут влиять на то, какой инстанс «держит» открытое состояние.

## Рекомендуемое архитектурное решение

**Поднять состояние модалки на уровень страницы** и рендерить **одно** модальное окно замены блюда на всю страницу меню.

### Изменения

1. **MenuPage** хранит состояние открытия swap:
   - например `swapTarget: { dayDate: string; mealIndex: number; recipeIndexInSlot: number } | null`.
   - При открытии: `setSwapTarget({ dayDate, mealIndex, recipeIndexInSlot })`.
   - При закрытии/после выбора: `setSwapTarget(null)`.

2. **MealSlot** не хранит `swapIndex` и не рендерит SwapModal. Вместо этого:
   - принимает колбэк `onRequestSwap(recipeIndexInSlot: number)` (или пропсы `dayDate`, `mealIndex`, `onRequestSwap`);
   - по клику на кнопку swap вызывается `onRequestSwap(index)`.

3. **MenuPage** передаёт в каждый MealSlot:
   - `dayDate={day.date}`, `mealIndex={index}` (индекс приёма в `day.meals`),
   - `onRequestSwap={(recipeIndex) => setSwapTarget({ dayDate: day.date, mealIndex: index, recipeIndexInSlot: recipeIndex })}`.

4. **Один SwapModal** рендерится в **MenuPage** (например, в конце разметки страницы или в отдельном слоте):
   - показывается при `swapTarget !== null`;
   - получает из `swapTarget` день и слот меню, текущий `recipeId` из `weekMenu.days[day].meals[mealIndex].recipes[recipeIndexInSlot]`, фильтры `forWhom` и `mealType`;
   - при выборе рецепта вызывает `handleMealSlotUpdate(dayDate, mealIndex, updatedSlot)` и `setSwapTarget(null)`.

Так модалка всегда рендерится из одного и того же места (страница), портал уходит в `document.body`, и нет зависимости от вложенности внутри аккордеона и `overflow-hidden`.

### Кнопка «Проверить ингредиенты» (button[5])

XPath `.../main/div[2]/div[4]/div[1]/button[5]` может указывать на пятую кнопку внутри первого блока (например, первого дня или первого приёма). В MealSlot после списка рецептов идёт одна кнопка «Проверить ингредиенты» — она не открывает модалку, а переключает локальный state `showIngredientCheck` и показывает блок `IngredientCheck`. Если под «модальным окном» имеется в виду именно этот блок проверки ингредиентов, то он не реализован через Modal, а как inline-контент. Если нужно, чтобы проверка ингредиентов открывалась в модальном окне (как в других экранах), тогда и для неё стоит вынести состояние на уровень страницы и рендерить одну модалку с `IngredientCheck` в портале.

### Диагностика перед рефакторингом

- В `handleSwapRecipe` временно добавить `console.log` или `alert`: убедиться, что клик доходит и `setSwapIndex` вызывается.
- В React DevTools проверить: при клике появляется ли в дереве компонент SwapModal с `isOpen={true}` и рендерится ли Modal.
- Проверить в Elements, появляется ли при открытии у `body` дочерний div с `z-index: 9999` (разметка из Modal).

Если клик не срабатывает — искать перехват события (родительские onClick, touch-обработчики). Если срабатывает и SwapModal в дереве есть, но overlay не виден — смотреть порядок слоёв и stacking context в DevTools.

---

**См. также:** [DEVTOOLS_AND_SELF_WORK.md](DEVTOOLS_AND_SELF_WORK.md) — инструкция по работе в DevTools для определения элементов и чек-лист самостоятельной подготовки (изучение кода, глоссарий, карточки NotebookLM).

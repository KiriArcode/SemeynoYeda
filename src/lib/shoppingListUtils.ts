/**
 * Правила списка покупок: минимум 500 г / 500 мл.
 * Используется в generateShoppingList и при ручном добавлении.
 */

import type { WeekMenu } from '../data/schema';

export const MIN_WEIGHT_G = 500;
export const MIN_VOLUME_ML = 500;

/** Применяет минимум 500 г для веса и 500 мл для объёма; остальные единицы не меняет. */
export function applyMinWeightOrVolume(item: {
  totalAmount: number;
  unit: string;
}): { totalAmount: number } {
  const u = item.unit;
  if (u === 'г') {
    return { totalAmount: Math.max(item.totalAmount, MIN_WEIGHT_G) };
  }
  if (u === 'кг') {
    const grams = item.totalAmount * 1000;
    const minGrams = Math.max(grams, MIN_WEIGHT_G);
    return { totalAmount: minGrams / 1000 };
  }
  if (u === 'мл') {
    return { totalAmount: Math.max(item.totalAmount, MIN_VOLUME_ML) };
  }
  if (u === 'л') {
    const ml = item.totalAmount * 1000;
    const minMl = Math.max(ml, MIN_VOLUME_ML);
    return { totalAmount: minMl / 1000 };
  }
  return { totalAmount: item.totalAmount };
}

/**
 * Считает суммарные порции по рецептам из меню по правилу forWhom:
 * kolya / kristina → 1 порция, both → 2 порции.
 */
export function getPortionsPerRecipeFromMenu(weekMenu: WeekMenu): Map<string, number> {
  const map = new Map<string, number>();
  console.log('[getPortionsPerRecipeFromMenu] start', { daysCount: weekMenu.days?.length ?? 0 });
  weekMenu.days.forEach((day) => {
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

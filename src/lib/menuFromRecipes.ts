/**
 * Генерация недельного меню из рецептов базы (случайный подбор).
 * Все 7 дней заполнены, включая субботу и воскресенье.
 */

import { nanoid } from 'nanoid';
import type { WeekMenu, MenuDay, MealSlot, Recipe, MealType } from '../data/schema';

const MEAL_ORDER: MealType[] = [
  'breakfast',
  'second_breakfast',
  'lunch',
  'snack',
  'dinner',
  'late_snack',
];

const DAY_NAMES: Record<number, string> = {
  0: 'Воскресенье',
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
};

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Максимум использований одного рецепта за неделю */
const MAX_RECIPE_USES_PER_WEEK = 4;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Подбор рецептов по типу приёма */
function getRecipesForMealType(recipes: Recipe[], mealType: MealType): Recipe[] {
  const filtered = recipes.filter((r) => r.excludedFromMenu !== true);
  switch (mealType) {
    case 'breakfast':
    case 'second_breakfast':
      return filtered.filter((r) => r.category === 'breakfast' || r.category === 'snack');
    case 'lunch':
    case 'dinner':
      return filtered.filter(
        (r) => r.category === 'main' || r.category === 'soup' || r.category === 'side' || r.category === 'sauce'
      );
    case 'snack':
    case 'late_snack':
      return filtered.filter((r) => r.category === 'snack' || r.category === 'breakfast' || r.category === 'dessert');
    default:
      return filtered;
  }
}

/**
 * Строит недельное меню случайным выбором из списка рецептов.
 * Каждый приём — 1–2 блюда (forWhom: both). Ограничение: один рецепт не чаще MAX_RECIPE_USES_PER_WEEK раз.
 */
export function buildWeekMenuFromRecipes(recipes: Recipe[]): WeekMenu {
  const today = new Date();
  const weekStart = getMondayOfWeek(today);
  const weekStartStr = toISODate(weekStart);
  const days: MenuDay[] = [];
  const useCount = new Map<string, number>();

  const pickOne = (pool: Recipe[]): Recipe | null => {
    const available = pool.filter((r) => (useCount.get(r.id) ?? 0) < MAX_RECIPE_USES_PER_WEEK);
    if (available.length === 0) return null;
    const shuffled = shuffle(available);
    return shuffled[0] ?? null;
  };

  const addUse = (recipeId: string) => {
    useCount.set(recipeId, (useCount.get(recipeId) ?? 0) + 1);
  };

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = toISODate(d);
    const dayOfWeek = DAY_NAMES[d.getDay()];
    const meals: MealSlot[] = [];

    for (const mealType of MEAL_ORDER) {
      const pool = getRecipesForMealType(recipes, mealType);
      const r1 = pickOne(pool);
      const slotRecipes: MealSlot['recipes'] = [];
      if (r1) {
        slotRecipes.push({ recipeId: r1.id, forWhom: 'both' });
        addUse(r1.id);
        const r2 = pickOne(pool.filter((r) => r.id !== r1.id));
        if (r2 && Math.random() > 0.6) {
          slotRecipes.push({ recipeId: r2.id, forWhom: 'both' });
          addUse(r2.id);
        }
      }
      meals.push({ mealType, recipes: slotRecipes });
    }

    days.push({ date: dateStr, dayOfWeek, meals });
  }

  const menu: WeekMenu = {
    id: nanoid(),
    weekStart: weekStartStr,
    days,
    shoppingListGenerated: false,
    createdAt: new Date().toISOString(),
  };

  return menu;
}

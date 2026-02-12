import { nanoid } from 'nanoid';
import type { WeekMenu, MenuDay, MealSlot } from './schema';
import { SEED_RECIPE_IDS } from './seedRecipes';

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

/** Порядок приёмов: 4 основных + опционально второй завтрак и второй ужин */
const MEAL_ORDER: MealSlot['mealType'][] = [
  'breakfast',
  'second_breakfast',
  'lunch',
  'snack',
  'dinner',
  'late_snack',
];

/** Пустые слоты приёмов на один день (все 6 типов, recipes: []) */
function emptyMeals(): MealSlot[] {
  return MEAL_ORDER.map((mt) => ({ mealType: mt, recipes: [] }));
}

/**
 * Создаёт недельное меню по документу (Пн–Вс).
 * Поддерживает 6 приёмов. Все 7 дней заполнены, включая субботу и воскресенье.
 */
export function getSeedWeekMenu(): WeekMenu {
  const today = new Date();
  const weekStart = getMondayOfWeek(today);
  const weekStartStr = toISODate(weekStart);
  const days: MenuDay[] = [];

  const ids = SEED_RECIPE_IDS;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = toISODate(d);
    const dayOfWeek = DAY_NAMES[d.getDay()];

    let meals: MealSlot[];

    switch (i) {
      case 0: // Понедельник
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.gorjachijButerbrod, forWhom: 'kristina' },
              { recipeId: ids.jogurtovyjSous, forWhom: 'kristina' },
              { recipeId: ids.ovsjanka, forWhom: 'kolya' },
            ],
          },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.kurinyeKotlety, forWhom: 'kristina' },
              { recipeId: ids.kartofelnoePure, forWhom: 'kristina' },
              { recipeId: ids.syrnyjSous, forWhom: 'kristina' },
              { recipeId: ids.kurinyeKotlety, forWhom: 'kolya' },
              { recipeId: ids.kartofelnoePure, forWhom: 'kolya' },
              { recipeId: ids.kabachkovyjSous, forWhom: 'kolya', variation: 'кабачковый соус' },
            ],
          },
          {
            mealType: 'snack',
            recipes: [
              { recipeId: ids.jogurtSyr, forWhom: 'kristina' },
              { recipeId: ids.jogurtPechjonojeJabloko, forWhom: 'kolya' },
            ],
          },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.rybnoeSufle, forWhom: 'both' },
              { recipeId: ids.morkovnoTykvennoePure, forWhom: 'both' },
              { recipeId: ids.slivkovoJogurtovyjSous, forWhom: 'both' },
            ],
          },
          { mealType: 'late_snack', recipes: [{ recipeId: ids.jogurtSyr, forWhom: 'kolya' }] },
        ];
        break;
      case 1: // Вторник
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.gorjachijButerbrod, forWhom: 'kristina' },
              { recipeId: ids.parovojOmlet, forWhom: 'kolya', variation: 'с кабачковым соусом' },
            ],
          },
          { mealType: 'second_breakfast', recipes: [{ recipeId: ids.tvorozhnyjKrem, forWhom: 'kolya' }] },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.svinoGovyazhieKotlety, forWhom: 'kristina' },
              { recipeId: ids.bulgur, forWhom: 'kristina' },
              { recipeId: ids.syrnyjSous, forWhom: 'kristina' },
              { recipeId: ids.svinoGovyazhieKotlety, forWhom: 'kolya' },
              { recipeId: ids.ris, forWhom: 'kolya' },
              { recipeId: ids.kabachkovyjSous, forWhom: 'kolya', variation: 'кабачковый соус' },
            ],
          },
          {
            mealType: 'snack',
            recipes: [
              { recipeId: ids.humusHleb, forWhom: 'kristina' },
              { recipeId: ids.bananJogurt, forWhom: 'kolya' },
            ],
          },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.ovoshhnoeRaguPure, forWhom: 'both' },
              { recipeId: ids.kurinyeKotlety, forWhom: 'both' },
              { recipeId: ids.syrnyjSous, forWhom: 'both' },
            ],
          },
          { mealType: 'late_snack', recipes: [] },
        ];
        break;
      case 2: // Среда
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.overnightOvsjanka, forWhom: 'both' },
            ],
          },
          { mealType: 'second_breakfast', recipes: [{ recipeId: ids.jogurtPechjonojeJabloko, forWhom: 'kolya' }] },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.frikadelki, forWhom: 'kristina' },
              { recipeId: ids.kartofelnoePure, forWhom: 'kristina' },
              { recipeId: ids.syrnyjSous, forWhom: 'kristina' },
              { recipeId: ids.frikadelki, forWhom: 'kolya' },
              { recipeId: ids.kartofelnoePure, forWhom: 'kolya' },
              { recipeId: ids.kabachkovyjSous, forWhom: 'kolya', variation: 'кабачковый соус' },
            ],
          },
          {
            mealType: 'snack',
            recipes: [
              { recipeId: ids.tvorozhnyjKrem, forWhom: 'both' },
            ],
          },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.kurinoeSufle, forWhom: 'both' },
              { recipeId: ids.kartofelnoePure, forWhom: 'both' },
              { recipeId: ids.jogurtovyjSous, forWhom: 'both' },
            ],
          },
          { mealType: 'late_snack', recipes: [{ recipeId: ids.syrJogurt, forWhom: 'kolya' }] },
        ];
        break;
      case 3: // Четверг
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.gorjachijButerbrod, forWhom: 'kristina' },
              { recipeId: ids.ovsjanka, forWhom: 'kolya' },
            ],
          },
          { mealType: 'second_breakfast', recipes: [] },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.rybnoeSufle, forWhom: 'both' },
              { recipeId: ids.morkovnoTykvennoePure, forWhom: 'both' },
              { recipeId: ids.slivkovoJogurtovyjSous, forWhom: 'both' },
            ],
          },
          {
            mealType: 'snack',
            recipes: [
              { recipeId: ids.jogurtSyr, forWhom: 'both' },
            ],
          },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.frikadelki, forWhom: 'both' },
              { recipeId: ids.kabachkovoePure, forWhom: 'both' },
              { recipeId: ids.syrnyjSous, forWhom: 'both' },
            ],
          },
          { mealType: 'late_snack', recipes: [] },
        ];
        break;
      case 4: // Пятница
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.overnightOvsjanka, forWhom: 'both' },
            ],
          },
          { mealType: 'second_breakfast', recipes: [{ recipeId: ids.bananJogurt, forWhom: 'kolya' }] },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.kurinyeKotlety, forWhom: 'kristina' },
              { recipeId: ids.grechka, forWhom: 'kristina' },
              { recipeId: ids.syrnyjSous, forWhom: 'kristina' },
              { recipeId: ids.kurinyeKotlety, forWhom: 'kolya' },
              { recipeId: ids.ris, forWhom: 'kolya' },
              { recipeId: ids.kabachkovyjSous, forWhom: 'kolya', variation: 'кабачковый соус' },
            ],
          },
          {
            mealType: 'snack',
            recipes: [
              { recipeId: ids.syrJogurt, forWhom: 'both' },
            ],
          },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.ovoshhnojKremSup, forWhom: 'both' },
              { recipeId: ids.gorjachijButerbrod, forWhom: 'both', variation: 'тост' },
            ],
          },
          { mealType: 'late_snack', recipes: [] },
        ];
        break;
      case 5: // Суббота
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.overnightOvsjanka, forWhom: 'both' },
            ],
          },
          { mealType: 'second_breakfast', recipes: [{ recipeId: ids.bananJogurt, forWhom: 'kolya' }] },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.ovoshhnojKremSup, forWhom: 'both' },
              { recipeId: ids.gorjachijButerbrod, forWhom: 'both', variation: 'тост' },
            ],
          },
          { mealType: 'snack', recipes: [{ recipeId: ids.tvorozhnyjKrem, forWhom: 'both' }] },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.kurinyeKotlety, forWhom: 'both' },
              { recipeId: ids.kabachkovoePure, forWhom: 'both' },
              { recipeId: ids.syrnyjSous, forWhom: 'both' },
            ],
          },
          { mealType: 'late_snack', recipes: [] },
        ];
        break;
      case 6: // Воскресенье
        meals = [
          {
            mealType: 'breakfast',
            recipes: [
              { recipeId: ids.gorjachijButerbrod, forWhom: 'kristina' },
              { recipeId: ids.parovojOmlet, forWhom: 'kolya' },
            ],
          },
          { mealType: 'second_breakfast', recipes: [] },
          {
            mealType: 'lunch',
            recipes: [
              { recipeId: ids.frikadelki, forWhom: 'both' },
              { recipeId: ids.kartofelnoePure, forWhom: 'both' },
              { recipeId: ids.kabachkovyjSous, forWhom: 'both', variation: 'кабачковый соус' },
            ],
          },
          { mealType: 'snack', recipes: [{ recipeId: ids.syrJogurt, forWhom: 'both' }] },
          {
            mealType: 'dinner',
            recipes: [
              { recipeId: ids.rybnoeSufle, forWhom: 'both' },
              { recipeId: ids.morkovnoTykvennoePure, forWhom: 'both' },
              { recipeId: ids.jogurtovyjSous, forWhom: 'both' },
            ],
          },
          { mealType: 'late_snack', recipes: [] },
        ];
        break;
      default:
        meals = emptyMeals();
    }

    days.push({
      date: dateStr,
      dayOfWeek,
      meals,
    });
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

/** Лёгкая неделя: тот же набор на 7 дней, акцент на супы и лёгкие блюда (сейчас совпадает с классической; можно расширить отличия). */
export function getSeedWeekMenuLight(): WeekMenu {
  return getSeedWeekMenu();
}

export type MenuTemplateId = 'classic' | 'light';

export const MENU_TEMPLATES: { id: MenuTemplateId; label: string; getMenu: () => WeekMenu }[] = [
  { id: 'classic', label: 'Классическая неделя', getMenu: getSeedWeekMenu },
  { id: 'light', label: 'Лёгкая неделя', getMenu: getSeedWeekMenuLight },
];

import Dexie, { type Table } from 'dexie';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  ShoppingItem,
  PrepPlan,
  BatchPlan,
  CookingSession,
  ChefModeSettings,
} from '../data/schema';

const db = new Dexie('SemeynoYedaDB') as Dexie & {
  recipes: Table<Recipe, 'id'>;
  menus: Table<WeekMenu, 'id'>;
  freezer: Table<FreezerItem, 'id'>;
  shopping: Table<ShoppingItem, 'ingredient'>;
  prepPlans: Table<PrepPlan, 'id'>;
  batchPlans: Table<BatchPlan, 'id'>;
  cookingSessions: Table<CookingSession, 'id'>;
  chefSettings: Table<ChefModeSettings, 'id'>;
};

// Версия 1: базовая схема
db.version(1).stores({
  recipes: 'id, slug, category, *tags, suitableFor',
  menus: 'id, weekStart',
  freezer: 'id, recipeId, expiryDate',
  shopping: 'ingredient, category, checked',
});

// Версия 2: добавление новых таблиц и полей
db.version(2)
  .stores({
    recipes: 'id, slug, category, *tags, suitableFor',
    menus: 'id, weekStart, shoppingDay',
    freezer: 'id, recipeId, expiryDate',
    shopping: 'ingredient, category, checked, markedMissing',
    prepPlans: 'id, date',
    cookingSessions: 'id, date, mealType',
    chefSettings: 'id',
  })
  .upgrade((tx) => {
    return tx
      .table('shopping')
      .toCollection()
      .modify((item: ShoppingItem) => {
        if (!item.source) {
          item.source = 'auto';
        }
        if (!item.markedMissing) {
          item.markedMissing = false;
        }
      });
  });

// Версия 3: добавление индекса createdAt для menus
db.version(3).stores({
  recipes: 'id, slug, category, *tags, suitableFor',
  menus: 'id, weekStart, shoppingDay, createdAt',
  freezer: 'id, recipeId, expiryDate',
  shopping: 'ingredient, category, checked, markedMissing',
  prepPlans: 'id, date',
  cookingSessions: 'id, date, mealType',
  chefSettings: 'id',
});

// Версия 4: расширение freezer (portionsRemaining, batchId)
db.version(4)
  .stores({
    recipes: 'id, slug, category, *tags, suitableFor',
    menus: 'id, weekStart, shoppingDay, createdAt',
    freezer: 'id, recipeId, expiryDate, batchId',
    shopping: 'ingredient, category, checked, markedMissing',
    prepPlans: 'id, date',
    cookingSessions: 'id, date, mealType',
    chefSettings: 'id',
  })
  .upgrade((tx) => {
    return tx
      .table('freezer')
      .toCollection()
      .modify((item: FreezerItem) => {
        if (item.portionsRemaining === undefined) {
          item.portionsRemaining = item.portions;
        }
        if (item.portionsOriginal === undefined) {
          item.portionsOriginal = item.portions;
        }
      });
  });

// Версия 5: план заготовок (batch cooking)
db.version(5).stores({
  recipes: 'id, slug, category, *tags, suitableFor',
  menus: 'id, weekStart, shoppingDay, createdAt',
  freezer: 'id, recipeId, expiryDate, batchId',
  shopping: 'ingredient, category, checked, markedMissing',
  prepPlans: 'id, date',
  batchPlans: 'id, date',
  cookingSessions: 'id, date, mealType',
  chefSettings: 'id',
});

export { db };

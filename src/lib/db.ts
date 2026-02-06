import Dexie, { type Table } from 'dexie';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  ShoppingItem,
  PrepPlan,
  CookingSession,
  ChefModeSettings,
} from '../data/schema';

const db = new Dexie('SemeynoYedaDB') as Dexie & {
  recipes: Table<Recipe, 'id'>;
  menus: Table<WeekMenu, 'id'>;
  freezer: Table<FreezerItem, 'id'>;
  shopping: Table<ShoppingItem, 'ingredient'>;
  prepPlans: Table<PrepPlan, 'id'>;
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
    // Миграция: добавить поле source в существующие ShoppingItem
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
db.version(3)
  .stores({
    recipes: 'id, slug, category, *tags, suitableFor',
    menus: 'id, weekStart, shoppingDay, createdAt',
    freezer: 'id, recipeId, expiryDate',
    shopping: 'ingredient, category, checked, markedMissing',
    prepPlans: 'id, date',
    cookingSessions: 'id, date, mealType',
    chefSettings: 'id',
  });

export { db };

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
  SyncMetadata,
} from '../data/schema';

/**
 * Каждая строка в IndexedDB может содержать метаданные синхронизации.
 * Это позволяет избежать `as any` при put/get операциях.
 */
type Row<T> = T & { _sync?: SyncMetadata };

const db = new Dexie('SemeynoYedaDB') as Dexie & {
  recipes: Table<Row<Recipe>, string>;
  menus: Table<Row<WeekMenu>, string>;
  freezer: Table<Row<FreezerItem>, string>;
  shopping: Table<Row<ShoppingItem>, string>;
  prepPlans: Table<Row<PrepPlan>, string>;
  batchPlans: Table<Row<BatchPlan>, string>;
  cookingSessions: Table<Row<CookingSession>, string>;
  chefSettings: Table<Row<ChefModeSettings>, string>;
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

// Версия 6: shopping — оставляем ingredient как PK (IndexedDB не поддерживает смену key path).
// Добавляем индекс id, upgrade задаёт id существующим записям.
db.version(6)
  .stores({
    recipes: 'id, slug, category, *tags, suitableFor',
    menus: 'id, weekStart, shoppingDay, createdAt',
    freezer: 'id, recipeId, expiryDate, batchId',
    shopping: 'ingredient, id, category, checked, markedMissing',
    prepPlans: 'id, date',
    batchPlans: 'id, date',
    cookingSessions: 'id, date, mealType',
    chefSettings: 'id',
  })
  .upgrade((tx) => {
    return tx
      .table('shopping')
      .toCollection()
      .modify((item: ShoppingItem & { id?: string }) => {
        if (!item.id) {
          item.id = crypto.randomUUID();
        }
      });
  });

export { db };

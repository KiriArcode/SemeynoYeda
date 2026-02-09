import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { ShoppingItem } from '../../../src/data/schema';

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM shopping ORDER BY category, ingredient');
  return (Array.isArray(rows) ? rows : [rows]).map((r) =>
    dbToApp<ShoppingItem>(r as Record<string, unknown>)
  );
}

export async function getShoppingItemByIngredient(
  ingredient: string
): Promise<ShoppingItem | null> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM shopping WHERE ingredient = $1', [ingredient]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<ShoppingItem>(row as Record<string, unknown>) : null;
}

export async function createShoppingItem(item: ShoppingItem): Promise<ShoppingItem> {
  const sql = getDb();
  const db = appToDb(item);

  await sql(
    `INSERT INTO shopping (ingredient, total_amount, unit, category, checked, recipe_ids, marked_missing, marked_at, source, covered_by_freezer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      db.ingredient,
      db.total_amount,
      db.unit,
      db.category,
      db.checked ?? false,
      db.recipe_ids ?? [],
      db.marked_missing ?? false,
      db.marked_at ?? null,
      db.source ?? 'auto',
      db.covered_by_freezer ?? false,
    ]
  );
  return item;
}

export async function bulkPutShoppingItems(items: ShoppingItem[]): Promise<void> {
  const sql = getDb();
  await sql('DELETE FROM shopping');
  for (const item of items) {
    const db = appToDb(item);
    await sql(
      `INSERT INTO shopping (ingredient, total_amount, unit, category, checked, recipe_ids, marked_missing, marked_at, source, covered_by_freezer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        db.ingredient,
        db.total_amount,
        db.unit,
        db.category,
        db.checked ?? false,
        db.recipe_ids ?? [],
        db.marked_missing ?? false,
        db.marked_at ?? null,
        db.source ?? 'auto',
        db.covered_by_freezer ?? false,
      ]
    );
  }
}

export async function updateShoppingItem(
  ingredient: string,
  updates: Partial<ShoppingItem>
): Promise<ShoppingItem | null> {
  const existing = await getShoppingItemByIngredient(ingredient);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  const sql = getDb();
  const db = appToDb(merged);

  await sql(
    `UPDATE shopping SET total_amount=$2, unit=$3, category=$4, checked=$5, recipe_ids=$6, marked_missing=$7, marked_at=$8, source=$9, covered_by_freezer=$10 WHERE ingredient=$1`,
    [
      ingredient,
      db.total_amount,
      db.unit,
      db.category,
      db.checked ?? false,
      db.recipe_ids ?? [],
      db.marked_missing ?? false,
      db.marked_at ?? null,
      db.source ?? 'auto',
      db.covered_by_freezer ?? false,
    ]
  );
  return merged;
}

export async function deleteShoppingItem(ingredient: string): Promise<boolean> {
  const sql = getDb();
  await sql('DELETE FROM shopping WHERE ingredient = $1', [ingredient]);
  return true;
}

export async function clearShoppingList(): Promise<void> {
  const sql = getDb();
  await sql('DELETE FROM shopping');
}

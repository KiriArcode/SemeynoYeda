import { getDb } from '../db.js';
import { dbToApp, appToDb } from '../mappers.js';
import type { ShoppingItem } from '../../../src/data/schema.js';

interface ShoppingDbRow {
  id: string;
  ingredient: string;
  total_amount: number;
  unit: string;
  category: string;
  checked: boolean;
  recipe_ids: string[];
  marked_missing?: boolean;
  marked_at?: string | null;
  source: string;
  covered_by_freezer?: boolean;
}

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM shopping ORDER BY category, ingredient`;
    const arr = Array.isArray(rows) ? rows : [rows];
    return arr.map((r) => dbToApp(r as Record<string, unknown>) as ShoppingItem);
  } catch (error) {
    console.error('[shoppingRepo.getShoppingItems] Error:', error);
    throw error;
  }
}

export async function getShoppingItemById(id: string): Promise<ShoppingItem | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM shopping WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? (dbToApp(row as Record<string, unknown>) as ShoppingItem) : null;
  } catch (error) {
    console.error('[shoppingRepo.getShoppingItemById] Error:', error);
    throw error;
  }
}

export async function createShoppingItem(item: ShoppingItem): Promise<ShoppingItem> {
  try {
    const sql = getDb();
    const db = appToDb(item as unknown as Record<string, unknown>) as unknown as ShoppingDbRow;

    await sql`
      INSERT INTO shopping (
        id, ingredient, total_amount, unit, category, checked, recipe_ids,
        marked_missing, marked_at, source, covered_by_freezer
      )
      VALUES (
        ${db.id}::text,
        ${db.ingredient}::text,
        ${db.total_amount}::numeric,
        ${db.unit}::text,
        ${db.category}::text,
        ${db.checked ?? false}::boolean,
        ${db.recipe_ids ?? []}::text[],
        ${db.marked_missing ?? false}::boolean,
        ${db.marked_at ?? null}::text,
        ${db.source ?? 'auto'}::text,
        ${db.covered_by_freezer ?? false}::boolean
      )
    `;
    return item;
  } catch (error) {
    console.error('[shoppingRepo.createShoppingItem] Error:', error);
    throw error;
  }
}

export async function bulkPutShoppingItems(items: ShoppingItem[]): Promise<void> {
  try {
    const sql = getDb();
    await sql`DELETE FROM shopping`;
    for (const item of items) {
      const db = appToDb(item as unknown as Record<string, unknown>) as unknown as ShoppingDbRow;
      await sql`
        INSERT INTO shopping (
          id, ingredient, total_amount, unit, category, checked, recipe_ids,
          marked_missing, marked_at, source, covered_by_freezer
        )
        VALUES (
          ${db.id}::text,
          ${db.ingredient}::text,
          ${db.total_amount}::numeric,
          ${db.unit}::text,
          ${db.category}::text,
          ${db.checked ?? false}::boolean,
          ${db.recipe_ids ?? []}::text[],
          ${db.marked_missing ?? false}::boolean,
          ${db.marked_at ?? null}::text,
          ${db.source ?? 'auto'}::text,
          ${db.covered_by_freezer ?? false}::boolean
        )
      `;
    }
  } catch (error) {
    console.error('[shoppingRepo.bulkPutShoppingItems] Error:', error);
    throw error;
  }
}

export async function updateShoppingItem(
  id: string,
  updates: Partial<ShoppingItem>
): Promise<ShoppingItem | null> {
  try {
    const existing = await getShoppingItemById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };
    const sql = getDb();
    const db = appToDb(merged as unknown as Record<string, unknown>) as unknown as ShoppingDbRow;

    await sql`
      UPDATE shopping SET
        ingredient = ${db.ingredient}::text,
        total_amount = ${db.total_amount}::numeric,
        unit = ${db.unit}::text,
        category = ${db.category}::text,
        checked = ${db.checked ?? false}::boolean,
        recipe_ids = ${db.recipe_ids ?? []}::text[],
        marked_missing = ${db.marked_missing ?? false}::boolean,
        marked_at = ${db.marked_at ?? null}::text,
        source = ${db.source ?? 'auto'}::text,
        covered_by_freezer = ${db.covered_by_freezer ?? false}::boolean
      WHERE id = ${id}::text
    `;
    return merged;
  } catch (error) {
    console.error('[shoppingRepo.updateShoppingItem] Error:', error);
    throw error;
  }
}

export async function deleteShoppingItem(id: string): Promise<boolean> {
  try {
    const sql = getDb();
    await sql`DELETE FROM shopping WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('[shoppingRepo.deleteShoppingItem] Error:', error);
    throw error;
  }
}

export async function clearShoppingList(): Promise<void> {
  try {
    const sql = getDb();
    await sql`DELETE FROM shopping`;
  } catch (error) {
    console.error('[shoppingRepo.clearShoppingList] Error:', error);
    throw error;
  }
}

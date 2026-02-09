import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { FreezerItem } from '../../../src/data/schema';

export async function getFreezerItems(): Promise<FreezerItem[]> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM freezer ORDER BY expiry_date`;
    const result = Array.isArray(rows) ? rows : [rows];
    return result.map((r) => dbToApp<FreezerItem>(r as Record<string, unknown>));
  } catch (error) {
    console.error('[freezerRepo.getFreezerItems] Error:', error);
    throw error;
  }
}

export async function getFreezerItemById(id: string): Promise<FreezerItem | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM freezer WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<FreezerItem>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[freezerRepo.getFreezerItemById] Error:', error);
    throw error;
  }
}

export async function createFreezerItem(item: FreezerItem): Promise<FreezerItem> {
  try {
    const sql = getDb();
    const db = appToDb(item as unknown as Record<string, unknown>);

    await sql`
      INSERT INTO freezer (
        id, recipe_id, name, portions, portions_remaining, portions_original,
        batch_id, frozen_date, expiry_date, location, for_whom, reheating
      )
      VALUES (
        ${db.id}::text,
        ${db.recipe_id}::text,
        ${db.name}::text,
        ${db.portions ?? db.portions_remaining ?? db.portions_original}::integer,
        ${db.portions_remaining ?? db.portions}::integer,
        ${db.portions_original ?? db.portions}::integer,
        ${db.batch_id ?? null}::text,
        ${db.frozen_date}::date,
        ${db.expiry_date}::date,
        ${db.location ?? null}::text,
        ${db.for_whom ?? null}::text,
        ${db.reheating ? JSON.stringify(db.reheating) : null}::jsonb
      )
    `;
    return item;
  } catch (error) {
    console.error('[freezerRepo.createFreezerItem] Error:', error);
    throw error;
  }
}

export async function updateFreezerItem(
  id: string,
  item: Partial<FreezerItem>
): Promise<FreezerItem | null> {
  try {
    const existing = await getFreezerItemById(id);
    if (!existing) return null;

    const merged = { ...existing, ...item };
    const sql = getDb();
    const db = appToDb(merged as unknown as Record<string, unknown>);

    await sql`
      UPDATE freezer SET
        recipe_id = ${db.recipe_id}::text,
        name = ${db.name}::text,
        portions = ${db.portions ?? db.portions_remaining}::integer,
        portions_remaining = ${db.portions_remaining}::integer,
        portions_original = ${db.portions_original}::integer,
        batch_id = ${db.batch_id ?? null}::text,
        frozen_date = ${db.frozen_date}::date,
        expiry_date = ${db.expiry_date}::date,
        location = ${db.location ?? null}::text,
        for_whom = ${db.for_whom ?? null}::text,
        reheating = ${db.reheating ? JSON.stringify(db.reheating) : null}::jsonb
      WHERE id = ${id}::text
    `;
    return merged;
  } catch (error) {
    console.error('[freezerRepo.updateFreezerItem] Error:', error);
    throw error;
  }
}

export async function deleteFreezerItem(id: string): Promise<boolean> {
  try {
    const sql = getDb();
    await sql`DELETE FROM freezer WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('[freezerRepo.deleteFreezerItem] Error:', error);
    throw error;
  }
}

import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { FreezerItem } from '../../../src/data/schema';

export async function getFreezerItems(): Promise<FreezerItem[]> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM freezer ORDER BY expiry_date');
  return (Array.isArray(rows) ? rows : [rows]).map((r) =>
    dbToApp<FreezerItem>(r as Record<string, unknown>)
  );
}

export async function getFreezerItemById(id: string): Promise<FreezerItem | null> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM freezer WHERE id = $1', [id] as [string, ...unknown[]]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<FreezerItem>(row as Record<string, unknown>) : null;
}

export async function createFreezerItem(item: FreezerItem): Promise<FreezerItem> {
  const sql = getDb();
  const db = appToDb(item as unknown as Record<string, unknown>);

  await (sql as any)(
    `INSERT INTO freezer (id, recipe_id, name, portions, portions_remaining, portions_original, batch_id, frozen_date, expiry_date, location, for_whom, reheating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      db.id,
      db.recipe_id,
      db.name,
      db.portions ?? db.portions_remaining ?? db.portions_original,
      db.portions_remaining ?? db.portions,
      db.portions_original ?? db.portions,
      db.batch_id ?? null,
      db.frozen_date,
      db.expiry_date,
      db.location ?? null,
      db.for_whom ?? null,
      db.reheating ? JSON.stringify(db.reheating) : null,
    ]
  );
  return item;
}

export async function updateFreezerItem(
  id: string,
  item: Partial<FreezerItem>
): Promise<FreezerItem | null> {
  const existing = await getFreezerItemById(id);
  if (!existing) return null;

  const merged = { ...existing, ...item };
  const sql = getDb();
  const db = appToDb(merged as unknown as Record<string, unknown>);

  await (sql as any)(
    `UPDATE freezer SET recipe_id=$2, name=$3, portions=$4, portions_remaining=$5, portions_original=$6, batch_id=$7, frozen_date=$8, expiry_date=$9, location=$10, for_whom=$11, reheating=$12 WHERE id=$1`,
    [
      id,
      db.recipe_id,
      db.name,
      db.portions ?? db.portions_remaining,
      db.portions_remaining,
      db.portions_original,
      db.batch_id ?? null,
      db.frozen_date,
      db.expiry_date,
      db.location ?? null,
      db.for_whom ?? null,
      db.reheating ? JSON.stringify(db.reheating) : null,
    ]
  );
  return merged;
}

export async function deleteFreezerItem(id: string): Promise<boolean> {
  const sql = getDb();
  await (sql as any)('DELETE FROM freezer WHERE id = $1', [id] as [string, ...unknown[]]);
  return true;
}

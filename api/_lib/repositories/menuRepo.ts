import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { WeekMenu } from '../../../src/data/schema';

export async function getMenus(): Promise<WeekMenu[]> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM menus ORDER BY created_at DESC');
  return (Array.isArray(rows) ? rows : [rows]).map((r) =>
    dbToApp<WeekMenu>(r as Record<string, unknown>)
  );
}

export async function getCurrentMenu(): Promise<WeekMenu | null> {
  const menus = await getMenus();
  return menus[0] ?? null;
}

export async function getMenuById(id: string): Promise<WeekMenu | null> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM menus WHERE id = $1', [id]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<WeekMenu>(row as Record<string, unknown>) : null;
}

export async function createMenu(menu: WeekMenu): Promise<WeekMenu> {
  const sql = getDb();
  const db = appToDb(menu);

  await sql(
    `INSERT INTO menus (id, week_start, days, shopping_list_generated, shopping_settings, shopping_day, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      db.id,
      db.week_start,
      JSON.stringify(db.days ?? []),
      db.shopping_list_generated ?? false,
      db.shopping_settings ? JSON.stringify(db.shopping_settings) : null,
      db.shopping_day ?? null,
      db.created_at,
    ]
  );
  return menu;
}

export async function updateMenu(id: string, menu: Partial<WeekMenu>): Promise<WeekMenu | null> {
  const existing = await getMenuById(id);
  if (!existing) return null;

  const merged = { ...existing, ...menu };
  const sql = getDb();
  const db = appToDb(merged);

  await sql(
    `UPDATE menus SET week_start=$2, days=$3, shopping_list_generated=$4, shopping_settings=$5, shopping_day=$6 WHERE id=$1`,
    [
      id,
      db.week_start,
      JSON.stringify(db.days ?? []),
      db.shopping_list_generated ?? false,
      db.shopping_settings ? JSON.stringify(db.shopping_settings) : null,
      db.shopping_day ?? null,
    ]
  );
  return merged;
}

export async function deleteMenu(id: string): Promise<boolean> {
  const sql = getDb();
  await sql('DELETE FROM menus WHERE id = $1', [id]);
  return true;
}

import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { WeekMenu } from '../../../src/data/schema';

export async function getMenus(): Promise<WeekMenu[]> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM menus ORDER BY created_at DESC`;
    const result = Array.isArray(rows) ? rows : [rows];
    return result.map((r) => dbToApp<WeekMenu>(r as Record<string, unknown>));
  } catch (error) {
    console.error('[menuRepo.getMenus] Error:', error);
    throw error;
  }
}

export async function getCurrentMenu(): Promise<WeekMenu | null> {
  const menus = await getMenus();
  return menus[0] ?? null;
}

export async function getMenuById(id: string): Promise<WeekMenu | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM menus WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<WeekMenu>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[menuRepo.getMenuById] Error:', error);
    throw error;
  }
}

export async function createMenu(menu: WeekMenu): Promise<WeekMenu> {
  try {
    const sql = getDb();
    const db = appToDb(menu as unknown as Record<string, unknown>);

    await sql`
      INSERT INTO menus (id, week_start, days, shopping_list_generated, shopping_settings, shopping_day, created_at)
      VALUES (
        ${db.id}::text,
        ${db.week_start}::date,
        ${JSON.stringify(db.days ?? [])}::jsonb,
        ${db.shopping_list_generated ?? false}::boolean,
        ${db.shopping_settings ? JSON.stringify(db.shopping_settings) : null}::jsonb,
        ${db.shopping_day ?? null}::text,
        ${db.created_at}::timestamptz
      )
    `;
    return menu;
  } catch (error) {
    console.error('[menuRepo.createMenu] Error:', error);
    throw error;
  }
}

export async function updateMenu(id: string, menu: Partial<WeekMenu>): Promise<WeekMenu | null> {
  try {
    const existing = await getMenuById(id);
    if (!existing) return null;

    const merged = { ...existing, ...menu };
    const sql = getDb();
    const db = appToDb(merged as unknown as Record<string, unknown>);

    await sql`
      UPDATE menus SET
        week_start = ${db.week_start}::date,
        days = ${JSON.stringify(db.days ?? [])}::jsonb,
        shopping_list_generated = ${db.shopping_list_generated ?? false}::boolean,
        shopping_settings = ${db.shopping_settings ? JSON.stringify(db.shopping_settings) : null}::jsonb,
        shopping_day = ${db.shopping_day ?? null}::text
      WHERE id = ${id}::text
    `;
    return merged;
  } catch (error) {
    console.error('[menuRepo.updateMenu] Error:', error);
    throw error;
  }
}

export async function deleteMenu(id: string): Promise<boolean> {
  try {
    const sql = getDb();
    await sql`DELETE FROM menus WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('[menuRepo.deleteMenu] Error:', error);
    throw error;
  }
}

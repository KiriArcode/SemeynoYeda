import { getDb } from '../db.js';
import { dbToApp, appToDb } from '../mappers.js';
import type { CookingSession } from '../../../src/data/schema.js';

export async function getCookingSessions(): Promise<CookingSession[]> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM cooking_sessions ORDER BY date DESC`;
    const result = Array.isArray(rows) ? rows : [rows];
    return result.map((r) => dbToApp<CookingSession>(r as Record<string, unknown>));
  } catch (error) {
    console.error('[cookingSessionRepo.getCookingSessions] Error:', error);
    throw error;
  }
}

export async function getCookingSessionByDate(date: string): Promise<CookingSession | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM cooking_sessions WHERE date = ${date}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<CookingSession>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[cookingSessionRepo.getCookingSessionByDate] Error:', error);
    throw error;
  }
}

export async function getCookingSessionById(id: string): Promise<CookingSession | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM cooking_sessions WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<CookingSession>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[cookingSessionRepo.getCookingSessionById] Error:', error);
    throw error;
  }
}

export async function createCookingSession(session: CookingSession): Promise<CookingSession> {
  try {
    const sql = getDb();
    const db = appToDb(session as unknown as Record<string, unknown>);

    await sql`
      INSERT INTO cooking_sessions (id, date, meal_type, recipes, timers, started_at, completed_at)
      VALUES (
        ${db.id}::text,
        ${db.date}::date,
        ${db.meal_type}::text,
        ${db.recipes ?? []}::text[],
        ${JSON.stringify(db.timers ?? [])}::jsonb,
        ${db.started_at ?? null}::timestamptz,
        ${db.completed_at ?? null}::timestamptz
      )
    `;
    return session;
  } catch (error) {
    console.error('[cookingSessionRepo.createCookingSession] Error:', error);
    throw error;
  }
}

export async function updateCookingSession(
  id: string,
  session: Partial<CookingSession>
): Promise<CookingSession | null> {
  try {
    const existing = await getCookingSessionById(id);
    if (!existing) return null;

    const merged = { ...existing, ...session };
    const sql = getDb();
    const db = appToDb(merged as unknown as Record<string, unknown>);

    await sql`
      UPDATE cooking_sessions SET
        date = ${db.date}::date,
        meal_type = ${db.meal_type}::text,
        recipes = ${db.recipes ?? []}::text[],
        timers = ${JSON.stringify(db.timers ?? [])}::jsonb,
        started_at = ${db.started_at ?? null}::timestamptz,
        completed_at = ${db.completed_at ?? null}::timestamptz
      WHERE id = ${id}::text
    `;
    return merged;
  } catch (error) {
    console.error('[cookingSessionRepo.updateCookingSession] Error:', error);
    throw error;
  }
}

export async function deleteCookingSession(id: string): Promise<boolean> {
  try {
    const sql = getDb();
    await sql`DELETE FROM cooking_sessions WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('[cookingSessionRepo.deleteCookingSession] Error:', error);
    throw error;
  }
}

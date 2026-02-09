import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { CookingSession } from '../../../src/data/schema';

export async function getCookingSessions(): Promise<CookingSession[]> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM cooking_sessions ORDER BY date DESC');
  return (Array.isArray(rows) ? rows : [rows]).map((r) =>
    dbToApp<CookingSession>(r as Record<string, unknown>)
  );
}

export async function getCookingSessionByDate(date: string): Promise<CookingSession | null> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM cooking_sessions WHERE date = $1', [date]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<CookingSession>(row as Record<string, unknown>) : null;
}

export async function getCookingSessionById(id: string): Promise<CookingSession | null> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM cooking_sessions WHERE id = $1', [id]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<CookingSession>(row as Record<string, unknown>) : null;
}

export async function createCookingSession(session: CookingSession): Promise<CookingSession> {
  const sql = getDb();
  const db = appToDb(session as unknown as Record<string, unknown>);

  await (sql as any)(
    `INSERT INTO cooking_sessions (id, date, meal_type, recipes, timers, started_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      db.id,
      db.date,
      db.meal_type,
      db.recipes ?? [],
      JSON.stringify(db.timers ?? []),
      db.started_at ?? null,
      db.completed_at ?? null,
    ]
  );
  return session;
}

export async function updateCookingSession(
  id: string,
  session: Partial<CookingSession>
): Promise<CookingSession | null> {
  const existing = await getCookingSessionById(id);
  if (!existing) return null;

  const merged = { ...existing, ...session };
  const sql = getDb();
  const db = appToDb(merged as unknown as Record<string, unknown>);

  await (sql as any)(
    `UPDATE cooking_sessions SET date=$2, meal_type=$3, recipes=$4, timers=$5, started_at=$6, completed_at=$7 WHERE id=$1`,
    [
      id,
      db.date,
      db.meal_type,
      db.recipes ?? [],
      JSON.stringify(db.timers ?? []),
      db.started_at ?? null,
      db.completed_at ?? null,
    ]
  );
  return merged;
}

export async function deleteCookingSession(id: string): Promise<boolean> {
  const sql = getDb();
  await (sql as any)('DELETE FROM cooking_sessions WHERE id = $1', [id]);
  return true;
}

import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { PrepPlan } from '../../../src/data/schema';

export async function getPrepPlans(): Promise<PrepPlan[]> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM prep_plans ORDER BY date DESC');
  return (Array.isArray(rows) ? rows : [rows]).map((r) =>
    dbToApp<PrepPlan>(r as Record<string, unknown>)
  );
}

export async function getPrepPlanByDate(date: string): Promise<PrepPlan | null> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM prep_plans WHERE date = $1', [date]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<PrepPlan>(row as Record<string, unknown>) : null;
}

export async function getPrepPlanById(id: string): Promise<PrepPlan | null> {
  const sql = getDb();
  const rows = await sql('SELECT * FROM prep_plans WHERE id = $1', [id]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<PrepPlan>(row as Record<string, unknown>) : null;
}

export async function createPrepPlan(plan: PrepPlan): Promise<PrepPlan> {
  const sql = getDb();
  const db = appToDb(plan);

  await sql(
    `INSERT INTO prep_plans (id, date, tasks, estimated_time, completed_tasks)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      db.id,
      db.date,
      JSON.stringify(db.tasks ?? []),
      db.estimated_time ?? 0,
      db.completed_tasks ?? [],
    ]
  );
  return plan;
}

export async function updatePrepPlan(
  id: string,
  plan: Partial<PrepPlan>
): Promise<PrepPlan | null> {
  const existing = await getPrepPlanById(id);
  if (!existing) return null;

  const merged = { ...existing, ...plan };
  const sql = getDb();
  const db = appToDb(merged);

  await sql(
    `UPDATE prep_plans SET date=$2, tasks=$3, estimated_time=$4, completed_tasks=$5 WHERE id=$1`,
    [
      id,
      db.date,
      JSON.stringify(db.tasks ?? []),
      db.estimated_time ?? 0,
      db.completed_tasks ?? [],
    ]
  );
  return merged;
}

export async function deletePrepPlan(id: string): Promise<boolean> {
  const sql = getDb();
  await sql('DELETE FROM prep_plans WHERE id = $1', [id]);
  return true;
}

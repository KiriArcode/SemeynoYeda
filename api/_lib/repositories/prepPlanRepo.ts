import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { PrepPlan } from '../../../src/data/schema';

export async function getPrepPlans(): Promise<PrepPlan[]> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM prep_plans ORDER BY date DESC`;
    const result = Array.isArray(rows) ? rows : [rows];
    return result.map((r) => dbToApp<PrepPlan>(r as Record<string, unknown>));
  } catch (error) {
    console.error('[prepPlanRepo.getPrepPlans] Error:', error);
    throw error;
  }
}

export async function getPrepPlanByDate(date: string): Promise<PrepPlan | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM prep_plans WHERE date = ${date}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<PrepPlan>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[prepPlanRepo.getPrepPlanByDate] Error:', error);
    throw error;
  }
}

export async function getPrepPlanById(id: string): Promise<PrepPlan | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM prep_plans WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<PrepPlan>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[prepPlanRepo.getPrepPlanById] Error:', error);
    throw error;
  }
}

export async function createPrepPlan(plan: PrepPlan): Promise<PrepPlan> {
  try {
    const sql = getDb();
    const db = appToDb(plan as unknown as Record<string, unknown>);

    await sql`
      INSERT INTO prep_plans (id, date, tasks, estimated_time, completed_tasks)
      VALUES (
        ${db.id}::text,
        ${db.date}::date,
        ${JSON.stringify(db.tasks ?? [])}::jsonb,
        ${db.estimated_time ?? 0}::integer,
        ${db.completed_tasks ?? []}::text[]
      )
    `;
    return plan;
  } catch (error) {
    console.error('[prepPlanRepo.createPrepPlan] Error:', error);
    throw error;
  }
}

export async function updatePrepPlan(
  id: string,
  plan: Partial<PrepPlan>
): Promise<PrepPlan | null> {
  try {
    const existing = await getPrepPlanById(id);
    if (!existing) return null;

    const merged = { ...existing, ...plan };
    const sql = getDb();
    const db = appToDb(merged as unknown as Record<string, unknown>);

    await sql`
      UPDATE prep_plans SET
        date = ${db.date}::date,
        tasks = ${JSON.stringify(db.tasks ?? [])}::jsonb,
        estimated_time = ${db.estimated_time ?? 0}::integer,
        completed_tasks = ${db.completed_tasks ?? []}::text[]
      WHERE id = ${id}::text
    `;
    return merged;
  } catch (error) {
    console.error('[prepPlanRepo.updatePrepPlan] Error:', error);
    throw error;
  }
}

export async function deletePrepPlan(id: string): Promise<boolean> {
  try {
    const sql = getDb();
    await sql`DELETE FROM prep_plans WHERE id = ${id}`;
    return true;
  } catch (error) {
    console.error('[prepPlanRepo.deletePrepPlan] Error:', error);
    throw error;
  }
}

import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { ChefModeSettings } from '../../../src/data/schema';

export async function getChefSettings(id: string = 'default'): Promise<ChefModeSettings | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM chef_settings WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<ChefModeSettings>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[chefSettingsRepo.getChefSettings] Error:', error);
    throw error;
  }
}

export async function upsertChefSettings(settings: ChefModeSettings): Promise<ChefModeSettings> {
  try {
    const sql = getDb();
    const db = appToDb(settings as unknown as Record<string, unknown>);

    await sql`
      INSERT INTO chef_settings (id, enabled, show_prep_block, show_parallel_cooking, default_prep_time, kolya_meals_mode)
      VALUES (
        ${db.id}::text,
        ${db.enabled ?? false}::boolean,
        ${db.show_prep_block ?? true}::boolean,
        ${db.show_parallel_cooking ?? true}::boolean,
        ${db.default_prep_time ?? 15}::integer,
        ${db.kolya_meals_mode ?? '4'}::text
      )
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        show_prep_block = EXCLUDED.show_prep_block,
        show_parallel_cooking = EXCLUDED.show_parallel_cooking,
        default_prep_time = EXCLUDED.default_prep_time,
        kolya_meals_mode = EXCLUDED.kolya_meals_mode
    `;
    return settings;
  } catch (error) {
    console.error('[chefSettingsRepo.upsertChefSettings] Error:', error);
    throw error;
  }
}

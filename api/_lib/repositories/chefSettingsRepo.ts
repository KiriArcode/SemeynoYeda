import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { ChefModeSettings } from '../../../src/data/schema';

export async function getChefSettings(id: string = 'default'): Promise<ChefModeSettings | null> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM chef_settings WHERE id = $1', [id]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<ChefModeSettings>(row as Record<string, unknown>) : null;
}

export async function upsertChefSettings(settings: ChefModeSettings): Promise<ChefModeSettings> {
  const sql = getDb();
  const db = appToDb(settings as unknown as Record<string, unknown>);

  await (sql as any)(
    `INSERT INTO chef_settings (id, enabled, show_prep_block, show_parallel_cooking, default_prep_time, kolya_meals_mode)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       show_prep_block = EXCLUDED.show_prep_block,
       show_parallel_cooking = EXCLUDED.show_parallel_cooking,
       default_prep_time = EXCLUDED.default_prep_time,
       kolya_meals_mode = EXCLUDED.kolya_meals_mode`,
    [
      db.id,
      db.enabled ?? false,
      db.show_prep_block ?? true,
      db.show_parallel_cooking ?? true,
      db.default_prep_time ?? 15,
      db.kolya_meals_mode ?? '4',
    ]
  );
  return settings;
}

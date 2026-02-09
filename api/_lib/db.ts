import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      const error = new Error('DATABASE_URL environment variable is not set');
      console.error('[db] Error:', error.message);
      console.error('[db] Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')));
      throw error;
    }
    try {
      sql = neon(connectionString);
    } catch (err) {
      console.error('[db] Failed to initialize Neon client:', err);
      throw err;
    }
  }
  return sql;
}

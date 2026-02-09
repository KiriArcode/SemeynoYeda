/**
 * Map camelCase (app schema) <-> snake_case (Postgres).
 * Used when reading/writing to the database.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapKeys(obj: Record<string, unknown>, fn: (s: string) => string): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = fn(k);
    result[newKey] = Array.isArray(v) && v[0] && typeof v[0] === 'object' && !Array.isArray(v[0])
      ? v.map((item) => mapKeys(item as Record<string, unknown>, fn))
      : typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date)
        ? mapKeys(v as Record<string, unknown>, fn)
        : v;
  }
  return result;
}

export function dbToApp<T>(row: Record<string, unknown>): T {
  return mapKeys(row, toCamel) as T;
}

export function appToDb<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return mapKeys(obj as Record<string, unknown>, toSnake);
}

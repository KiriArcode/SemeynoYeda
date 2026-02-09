import { getDb } from '../db';
import { dbToApp, appToDb } from '../mappers';
import type { Recipe } from '../../../src/data/schema';

export async function getRecipes(filters?: {
  category?: string;
  tags?: string[];
}): Promise<Recipe[]> {
  const sql = getDb();
  let query = 'SELECT * FROM recipes ORDER BY title';
  const params: (string | string[])[] = [];

  if (filters?.category) {
    query = 'SELECT * FROM recipes WHERE category = $1 ORDER BY title';
    params.push(filters.category);
  }
  if (filters?.tags?.length) {
    query = filters.category
      ? 'SELECT * FROM recipes WHERE category = $1 AND tags && $2 ORDER BY title'
      : 'SELECT * FROM recipes WHERE tags && $1 ORDER BY title';
    params.push(filters.tags);
  }

  // Neon serverless использует tagged template literals, но для обратной совместимости
  // используем обычные строки с параметрами (это работает через внутреннюю обертку)
  const rows = params.length 
    ? await (sql as any)(query, params as [string, ...unknown[]]) 
    : await (sql as any)(query);
  return (Array.isArray(rows) ? rows : [rows]).map((r) => dbToApp<Recipe>(r as Record<string, unknown>));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const sql = getDb();
  const rows = await (sql as any)('SELECT * FROM recipes WHERE id = $1', [id] as [string, ...unknown[]]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ? dbToApp<Recipe>(row as Record<string, unknown>) : null;
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  const sql = getDb();
  const db = appToDb(recipe as unknown as Record<string, unknown>);
  await (sql as any)(
    `INSERT INTO recipes (id, slug, title, subtitle, category, tags, suitable_for, prep_time, cook_time, total_time, servings, ingredients, steps, equipment, notes, storage, reheating, version, source, image_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
    [
      db.id,
      db.slug,
      db.title,
      db.subtitle ?? null,
      db.category,
      db.tags ?? [],
      db.suitable_for,
      db.prep_time,
      db.cook_time,
      db.total_time,
      db.servings,
      JSON.stringify(db.ingredients ?? []),
      JSON.stringify(db.steps ?? []),
      db.equipment ?? [],
      db.notes ?? null,
      JSON.stringify(db.storage ?? {}),
      db.reheating ? JSON.stringify(db.reheating) : null,
      db.version ?? null,
      db.source ?? null,
      db.image_url ?? null,
      db.created_at,
      db.updated_at,
    ]
  );
  return recipe;
}

export async function updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | null> {
  const existing = await getRecipeById(id);
  if (!existing) return null;

  const merged = { ...existing, ...recipe, updatedAt: new Date().toISOString() };
  const sql = getDb();
  const db = appToDb(merged as unknown as Record<string, unknown>);

  await (sql as any)(
    `UPDATE recipes SET slug=$2, title=$3, subtitle=$4, category=$5, tags=$6, suitable_for=$7, prep_time=$8, cook_time=$9, total_time=$10, servings=$11, ingredients=$12, steps=$13, equipment=$14, notes=$15, storage=$16, reheating=$17, version=$18, source=$19, image_url=$20, updated_at=$21 WHERE id=$1`,
    [
      id,
      db.slug,
      db.title,
      db.subtitle ?? null,
      db.category,
      db.tags ?? [],
      db.suitable_for,
      db.prep_time,
      db.cook_time,
      db.total_time,
      db.servings,
      JSON.stringify(db.ingredients ?? []),
      JSON.stringify(db.steps ?? []),
      db.equipment ?? [],
      db.notes ?? null,
      JSON.stringify(db.storage ?? {}),
      db.reheating ? JSON.stringify(db.reheating) : null,
      db.version ?? null,
      db.source ?? null,
      db.image_url ?? null,
      db.updated_at,
    ]
  );
  return merged;
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const sql = getDb();
  await (sql as any)('DELETE FROM recipes WHERE id = $1', [id] as [string, ...unknown[]]);
  // Neon serverless не возвращает rowCount, поэтому считаем успешным если нет ошибки
  return true;
}

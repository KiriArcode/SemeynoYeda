import { getDb } from '../db.js';
import { dbToApp, appToDb } from '../mappers.js';
import type { Recipe } from '../../../src/data/schema.js';

export async function getRecipes(filters?: {
  category?: string;
  tags?: string[];
}): Promise<Recipe[]> {
  try {
    const sql = getDb();
    let rows: unknown[];
    
    if (filters?.category && filters?.tags?.length) {
      // Используем tagged template literals для Neon
      rows = await sql`
        SELECT * FROM recipes 
        WHERE category = ${filters.category} 
        AND tags && ${filters.tags}::text[]
        ORDER BY title
      `;
    } else if (filters?.category) {
      rows = await sql`
        SELECT * FROM recipes 
        WHERE category = ${filters.category} 
        ORDER BY title
      `;
    } else if (filters?.tags?.length) {
      rows = await sql`
        SELECT * FROM recipes 
        WHERE tags && ${filters.tags}::text[]
        ORDER BY title
      `;
    } else {
      rows = await sql`SELECT * FROM recipes ORDER BY title`;
    }
    
    const result = Array.isArray(rows) ? rows : [rows];
    return result.map((r) => dbToApp<Recipe>(r as Record<string, unknown>));
  } catch (error) {
    console.error('[recipeRepo.getRecipes] Error:', error);
    throw error;
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM recipes WHERE id = ${id}`;
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? dbToApp<Recipe>(row as Record<string, unknown>) : null;
  } catch (error) {
    console.error('[recipeRepo.getRecipeById] Error:', error);
    throw error;
  }
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  try {
    const sql = getDb();
    const db = appToDb(recipe as unknown as Record<string, unknown>);
    
    await sql`
      INSERT INTO recipes (
        id, slug, title, subtitle, category, tags, suitable_for,
        prep_time, cook_time, total_time, servings,
        ingredients, steps, equipment, notes, storage, reheating,
        version, source, image_url, created_at, updated_at
      )
      VALUES (
        ${db.id}::text,
        ${db.slug}::text,
        ${db.title}::text,
        ${db.subtitle ?? null}::text,
        ${db.category}::text,
        ${db.tags ?? []}::text[],
        ${db.suitable_for}::text,
        ${db.prep_time}::integer,
        ${db.cook_time}::integer,
        ${db.total_time}::integer,
        ${db.servings}::integer,
        ${JSON.stringify(db.ingredients ?? [])}::jsonb,
        ${JSON.stringify(db.steps ?? [])}::jsonb,
        ${db.equipment ?? []}::text[],
        ${db.notes ?? null}::text,
        ${JSON.stringify(db.storage ?? {})}::jsonb,
        ${db.reheating ? JSON.stringify(db.reheating) : null}::jsonb,
        ${db.version ?? null}::integer,
        ${db.source ?? null}::text,
        ${db.image_url ?? null}::text,
        ${db.created_at}::timestamptz,
        ${db.updated_at}::timestamptz
      )
    `;
    return recipe;
  } catch (error) {
    console.error('[recipeRepo.createRecipe] Error:', error);
    throw error;
  }
}

export async function updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | null> {
  try {
    const existing = await getRecipeById(id);
    if (!existing) return null;

    const merged = { ...existing, ...recipe, updatedAt: new Date().toISOString() };
    const sql = getDb();
    const db = appToDb(merged as unknown as Record<string, unknown>);

    await sql`
      UPDATE recipes SET
        slug = ${db.slug}::text,
        title = ${db.title}::text,
        subtitle = ${db.subtitle ?? null}::text,
        category = ${db.category}::text,
        tags = ${db.tags ?? []}::text[],
        suitable_for = ${db.suitable_for}::text,
        prep_time = ${db.prep_time}::integer,
        cook_time = ${db.cook_time}::integer,
        total_time = ${db.total_time}::integer,
        servings = ${db.servings}::integer,
        ingredients = ${JSON.stringify(db.ingredients ?? [])}::jsonb,
        steps = ${JSON.stringify(db.steps ?? [])}::jsonb,
        equipment = ${db.equipment ?? []}::text[],
        notes = ${db.notes ?? null}::text,
        storage = ${JSON.stringify(db.storage ?? {})}::jsonb,
        reheating = ${db.reheating ? JSON.stringify(db.reheating) : null}::jsonb,
        version = ${db.version ?? null}::integer,
        source = ${db.source ?? null}::text,
        image_url = ${db.image_url ?? null}::text,
        updated_at = ${db.updated_at}::timestamptz
      WHERE id = ${id}::text
    `;
    return merged;
  } catch (error) {
    console.error('[recipeRepo.updateRecipe] Error:', error);
    throw error;
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  try {
    const sql = getDb();
    await sql`DELETE FROM recipes WHERE id = ${id}`;
    // Neon serverless не возвращает rowCount, поэтому считаем успешным если нет ошибки
    return true;
  } catch (error) {
    console.error('[recipeRepo.deleteRecipe] Error:', error);
    throw error;
  }
}

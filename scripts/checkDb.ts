/**
 * Check database state and synchronization.
 * Run: npx tsx scripts/checkDb.ts
 * Requires: DATABASE_URL (Neon connection string)
 */

import { getSeedRecipes } from '../src/data/seedRecipes';
import { getDb } from '../api/_lib/db';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing env: DATABASE_URL (Neon connection string)');
  process.exit(1);
}

async function checkDb() {
  const sql = getDb();
  const seedRecipes = getSeedRecipes();

  console.log('=== Database Check ===\n');

  // Check recipes count
  const recipeCountResult = await sql('SELECT COUNT(*) as count FROM recipes');
  const recipeCount = Array.isArray(recipeCountResult)
    ? Number(recipeCountResult[0]?.count ?? 0)
    : Number((recipeCountResult as { count: number }).count ?? 0);

  console.log(`Recipes in database: ${recipeCount}`);
  console.log(`Recipes in seedRecipes.ts: ${seedRecipes.length}`);
  console.log(`Difference: ${seedRecipes.length - recipeCount}\n`);

  // Check for missing recipes
  const dbRecipeIds = await sql('SELECT id FROM recipes');
  const dbIds = Array.isArray(dbRecipeIds)
    ? dbRecipeIds.map((r: { id: string }) => r.id)
    : [(dbRecipeIds as { id: string }).id];

  const seedIds = seedRecipes.map((r) => r.id);
  const missingIds = seedIds.filter((id) => !dbIds.includes(id));

  if (missingIds.length > 0) {
    console.log(`Missing recipes (${missingIds.length}):`);
    missingIds.forEach((id) => {
      const recipe = seedRecipes.find((r) => r.id === id);
      console.log(`  - ${id}: ${recipe?.title ?? 'unknown'}`);
    });
  } else {
    console.log('✓ All seed recipes are in database');
  }

  // Check tables
  console.log('\n=== Tables Check ===');
  const tables = ['recipes', 'menus', 'freezer', 'shopping', 'prep_plans', 'cooking_sessions', 'chef_settings'];
  for (const table of tables) {
    try {
      const result = await sql(`SELECT COUNT(*) as count FROM ${table}`);
      const count = Array.isArray(result)
        ? Number(result[0]?.count ?? 0)
        : Number((result as { count: number }).count ?? 0);
      console.log(`  ${table}: ${count} records`);
    } catch (error) {
      console.log(`  ${table}: ERROR - ${(error as Error).message}`);
    }
  }

  console.log('\n=== Check Complete ===');
}

checkDb().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});

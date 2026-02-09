/**
 * Seed Neon/Postgres with recipes and seed menu using repositories.
 * Run: npx tsx scripts/seedDb.ts
 * Requires: DATABASE_URL (Neon connection string)
 * 
 * Note: For better performance, consider using seedNeon.ts which uses
 * direct SQL upsert with ON CONFLICT instead of checking existence first.
 */

import { getSeedRecipes } from '../src/data/seedRecipes';
import { getSeedWeekMenu } from '../src/data/seedMenu';
import * as recipeRepo from '../api/_lib/repositories/recipeRepo';
import * as menuRepo from '../api/_lib/repositories/menuRepo';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing env: DATABASE_URL (Neon connection string)');
  process.exit(1);
}

async function seed() {
  const recipes = getSeedRecipes();
  const menu = getSeedWeekMenu();

  console.log(`Seeding ${recipes.length} recipes...`);
  for (const recipe of recipes) {
    const existing = await recipeRepo.getRecipeById(recipe.id);
    if (existing) {
      await recipeRepo.updateRecipe(recipe.id, recipe);
    } else {
      await recipeRepo.createRecipe(recipe);
    }
  }
  console.log('Recipes seeded OK');

  console.log('Seeding menu...');
  const existingMenu = await menuRepo.getMenuById(menu.id);
  if (existingMenu) {
    await menuRepo.updateMenu(menu.id, menu);
  } else {
    await menuRepo.createMenu(menu);
  }
  console.log('Menu seeded OK');

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

/**
 * Seed Supabase with recipes and seed menu.
 * Run: npx tsx scripts/seedSupabase.ts
 * Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for RLS bypass)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSeedRecipes } from '../src/data/seedRecipes';
import { getSeedWeekMenu } from '../src/data/seedMenu';
import type { Recipe, WeekMenu } from '../src/data/schema';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for initial seed with RLS)'
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

function recipeToRow(r: Recipe): Record<string, unknown> {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle ?? null,
    category: r.category,
    tags: r.tags,
    suitable_for: r.suitableFor,
    prep_time: r.prepTime,
    cook_time: r.cookTime,
    total_time: r.totalTime,
    servings: r.servings,
    ingredients: r.ingredients,
    steps: r.steps,
    equipment: r.equipment,
    notes: r.notes ?? null,
    storage: r.storage,
    reheating: r.reheating ?? null,
    version: r.version ?? null,
    source: r.source ?? null,
    image_url: r.imageUrl ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function menuToRow(m: WeekMenu): Record<string, unknown> {
  return {
    id: m.id,
    week_start: m.weekStart,
    days: m.days,
    shopping_list_generated: m.shoppingListGenerated,
    shopping_settings: m.shoppingSettings ?? null,
    shopping_day: m.shoppingDay ?? null,
    created_at: m.createdAt,
  };
}

async function seed() {
  const recipes = getSeedRecipes();
  const menu = getSeedWeekMenu();

  console.log(`Seeding ${recipes.length} recipes...`);
  const { error: recipesError } = await supabase
    .from('recipes')
    .upsert(recipes.map(recipeToRow), {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (recipesError) {
    console.error('Recipes seed error:', recipesError);
    throw recipesError;
  }
  console.log('Recipes seeded OK');

  console.log('Seeding menu...');
  const { error: menuError } = await supabase
    .from('menus')
    .upsert(menuToRow(menu), {
      onConflict: 'id',
      ignoreDuplicates: false,
    });

  if (menuError) {
    console.error('Menu seed error:', menuError);
    throw menuError;
  }
  console.log('Menu seeded OK');

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

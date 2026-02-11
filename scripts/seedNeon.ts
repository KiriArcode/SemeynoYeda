/**
 * Seed Neon PostgreSQL with recipes and seed menu using direct SQL upsert.
 * Run: npx tsx scripts/seedNeon.ts
 * Requires: DATABASE_URL (Neon connection string)
 * 
 * This script uses ON CONFLICT for efficient upsert operations.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSeedRecipes } from '../src/data/seedRecipes';
import { getSeedWeekMenu } from '../src/data/seedMenu';
import { appToDb } from '../api/_lib/mappers';
import type { Recipe, WeekMenu } from '../src/data/schema';

// Попытка загрузить DATABASE_URL из .env файла, если не установлен в process.env
function loadEnvFile(): void {
  if (process.env.DATABASE_URL) return; // Уже установлен
  
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key.trim() === 'DATABASE_URL' && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Удаляем кавычки если есть
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env.DATABASE_URL = cleanValue;
        console.log('✓ Loaded DATABASE_URL from .env file');
        return;
      }
    }
  } catch (error) {
    // .env файл не найден или не может быть прочитан - это нормально
    // Будем использовать process.env.DATABASE_URL
  }
}

loadEnvFile();
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.trim() === '') {
  console.error('❌ Missing env: DATABASE_URL (Neon connection string)');
  console.error('');
  console.error('Please set the DATABASE_URL environment variable:');
  console.error('  export DATABASE_URL="postgresql://user:password@host.tld/dbname?sslmode=require"');
  console.error('');
  console.error('Or run with inline env:');
  console.error('  DATABASE_URL="postgresql://..." npm run seed:neon');
  process.exit(1);
}

// Валидация формата строки подключения
if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ Invalid DATABASE_URL format');
  console.error('');
  console.error('Expected format: postgresql://user:password@host.tld/dbname?option=value');
  console.error(`Received: ${DATABASE_URL.substring(0, 50)}${DATABASE_URL.length > 50 ? '...' : ''}`);
  console.error('');
  console.error('Make sure your connection string starts with "postgresql://" or "postgres://"');
  process.exit(1);
}

let sql;
try {
  sql = neon(DATABASE_URL);
} catch (error) {
  console.error('❌ Failed to initialize Neon client');
  console.error('');
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error(`Error: ${String(error)}`);
  }
  console.error('');
  console.error('Please check your DATABASE_URL format.');
  process.exit(1);
}

/**
 * Преобразует рецепт в формат для PostgreSQL (snake_case + JSONB)
 * JSONB поля сериализуются в строки JSON для корректной передачи в PostgreSQL
 */
function recipeToRow(r: Recipe): Record<string, unknown> {
  const db = appToDb(r as unknown as Record<string, unknown>);
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    subtitle: db.subtitle ?? null,
    category: db.category,
    tags: db.tags ?? [],
    suitable_for: db.suitable_for,
    prep_time: db.prep_time,
    cook_time: db.cook_time,
    total_time: db.total_time,
    servings: db.servings,
    ingredients: JSON.stringify(db.ingredients ?? []),
    steps: JSON.stringify(db.steps ?? []),
    equipment: db.equipment ?? [],
    notes: db.notes ?? null,
    storage: JSON.stringify(db.storage ?? {}),
    reheating: db.reheating ? JSON.stringify(db.reheating) : null,
    version: db.version ?? null,
    source: db.source ?? null,
    image_url: db.image_url ?? null,
    created_at: db.created_at,
    updated_at: db.updated_at,
    wabba_ratings: db.wabba_ratings ? JSON.stringify(db.wabba_ratings) : null,
    excluded_from_menu: db.excluded_from_menu ?? false,
  };
}

/**
 * Преобразует меню в формат для PostgreSQL (snake_case + JSONB)
 * JSONB поля сериализуются в строки JSON для корректной передачи в PostgreSQL
 */
function menuToRow(m: WeekMenu): Record<string, unknown> {
  const db = appToDb(m as unknown as Record<string, unknown>);
  return {
    id: db.id,
    week_start: db.week_start,
    days: JSON.stringify(db.days ?? []),
    shopping_list_generated: db.shopping_list_generated ?? false,
    shopping_settings: db.shopping_settings ? JSON.stringify(db.shopping_settings) : null,
    shopping_day: db.shopping_day ?? null,
    created_at: db.created_at,
  };
}

async function seed() {
  const recipes = getSeedRecipes();
  const menu = getSeedWeekMenu();

  console.log(`Seeding ${recipes.length} recipes...`);

  // Upsert рецептов с использованием ON CONFLICT
  for (const recipe of recipes) {
    const row = recipeToRow(recipe);
    
    await sql`
      INSERT INTO recipes (
        id, slug, title, subtitle, category, tags, suitable_for,
        prep_time, cook_time, total_time, servings,
        ingredients, steps, equipment, notes, storage, reheating,
        version, source, image_url, created_at, updated_at,
        wabba_ratings, excluded_from_menu
      )
      VALUES (
        ${row.id}::text,
        ${row.slug}::text,
        ${row.title}::text,
        ${row.subtitle}::text,
        ${row.category}::text,
        ${row.tags}::text[],
        ${row.suitable_for}::text,
        ${row.prep_time}::integer,
        ${row.cook_time}::integer,
        ${row.total_time}::integer,
        ${row.servings}::integer,
        ${row.ingredients as string}::jsonb,
        ${row.steps as string}::jsonb,
        ${row.equipment}::text[],
        ${row.notes}::text,
        ${row.storage as string}::jsonb,
        ${row.reheating as string | null}::jsonb,
        ${row.version}::integer,
        ${row.source}::text,
        ${row.image_url}::text,
        ${row.created_at}::timestamptz,
        ${row.updated_at}::timestamptz,
        ${row.wabba_ratings as string | null}::jsonb,
        ${row.excluded_from_menu as boolean}::boolean
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        suitable_for = EXCLUDED.suitable_for,
        prep_time = EXCLUDED.prep_time,
        cook_time = EXCLUDED.cook_time,
        total_time = EXCLUDED.total_time,
        servings = EXCLUDED.servings,
        ingredients = EXCLUDED.ingredients,
        steps = EXCLUDED.steps,
        equipment = EXCLUDED.equipment,
        notes = EXCLUDED.notes,
        storage = EXCLUDED.storage,
        reheating = EXCLUDED.reheating,
        version = EXCLUDED.version,
        source = EXCLUDED.source,
        image_url = EXCLUDED.image_url,
        updated_at = EXCLUDED.updated_at,
        wabba_ratings = EXCLUDED.wabba_ratings,
        excluded_from_menu = EXCLUDED.excluded_from_menu
    `;
  }

  console.log('Recipes seeded OK');

  console.log('Seeding menu...');
  const menuRow = menuToRow(menu);

  await sql`
    INSERT INTO menus (
      id, week_start, days, shopping_list_generated,
      shopping_settings, shopping_day, created_at
    )
    VALUES (
      ${menuRow.id}::text,
      ${menuRow.week_start}::text,
      ${menuRow.days as string}::jsonb,
      ${menuRow.shopping_list_generated}::boolean,
      ${menuRow.shopping_settings as string | null}::jsonb,
      ${menuRow.shopping_day}::text,
      ${menuRow.created_at}::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      week_start = EXCLUDED.week_start,
      days = EXCLUDED.days,
      shopping_list_generated = EXCLUDED.shopping_list_generated,
      shopping_settings = EXCLUDED.shopping_settings,
      shopping_day = EXCLUDED.shopping_day
  `;

  console.log('Menu seeded OK');
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

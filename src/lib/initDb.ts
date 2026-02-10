import { db } from './db';
import { logger } from './logger';
import { getSeedRecipes } from '../data/seedRecipes';
import { getSeedWeekMenu } from '../data/seedMenu';
import type { Recipe } from '../data/schema';

/**
 * Инициализирует и синхронизирует базу данных при каждом запуске.
 * Использует версионирование: seed перезаписывает только если seed.version > db.version.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await syncSeedRecipes();
    await syncSeedMenu();
  } catch (error) {
    logger.error('[initDb] Ошибка при инициализации базы данных:', error);
  }
}

/**
 * Синхронизация seed-рецептов с версионированием.
 * Если рецепт существует в БД и seed.version <= db.version — не перезаписываем.
 * Если рецепт не существует или seed.version > db.version — upsert.
 */
async function syncSeedRecipes(): Promise<void> {
  const seedRecipes = getSeedRecipes();
  const existingRecipes = await db.table('recipes').bulkGet(seedRecipes.map(r => r.id));

  const toUpsert: Recipe[] = [];
  for (let i = 0; i < seedRecipes.length; i++) {
    const seed = seedRecipes[i];
    const existing = existingRecipes[i];
    if (!existing) {
      toUpsert.push(seed);
    } else if (seed.version && (!existing.version || seed.version > existing.version)) {
      toUpsert.push(seed);
    } else if (!seed.version) {
      // Без версии — всегда upsert (обратная совместимость)
      toUpsert.push(seed);
    }
  }

  if (toUpsert.length > 0) {
    await db.table('recipes').bulkPut(toUpsert);
  }
  logger.log(`[initDb] Синхронизировано ${toUpsert.length}/${seedRecipes.length} seed-рецептов`);
}

/**
 * Upsert seed-меню. Создаёт если нет, обновляет если есть.
 */
async function syncSeedMenu(): Promise<void> {
  const menu = getSeedWeekMenu();
  await db.table('menus').put(menu);
  logger.log('[initDb] Синхронизировано seed-меню');
}

/**
 * Проверяет, нужно ли показать сообщение о пустой базе данных
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const recipeCount = await db.table('recipes').count();
    const menuCount = await db.table('menus').count();
    return recipeCount === 0 && menuCount === 0;
  } catch (error) {
    logger.error('[initDb] Ошибка при проверке базы данных:', error);
    return true;
  }
}

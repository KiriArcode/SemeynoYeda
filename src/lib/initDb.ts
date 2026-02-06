import { db } from './db';
import { getSeedRecipes } from '../data/seedRecipes';
import { getSeedWeekMenu } from '../data/seedMenu';

/**
 * Инициализирует и синхронизирует базу данных при каждом запуске.
 * Всегда делает upsert seed-рецептов и seed-меню,
 * чтобы новые рецепты из git попадали в приложение.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await syncSeedRecipes();
    await syncSeedMenu();
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}

/**
 * Upsert всех seed-рецептов в БД по id.
 * Новые добавляются, существующие обновляются.
 * Рецепты, созданные пользователем (без seed- prefix), не затрагиваются.
 */
async function syncSeedRecipes(): Promise<void> {
  const seedRecipes = getSeedRecipes();
  // bulkPut делает upsert: если id существует — обновить, иначе создать
  await db.table('recipes').bulkPut(seedRecipes);
  console.log(`Синхронизировано ${seedRecipes.length} seed-рецептов`);
}

/**
 * Upsert seed-меню. Создаёт если нет, обновляет если есть.
 */
async function syncSeedMenu(): Promise<void> {
  const menu = getSeedWeekMenu();
  await db.table('menus').put(menu);
  console.log('Синхронизировано seed-меню');
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
    console.error('Ошибка при проверке базы данных:', error);
    return true;
  }
}

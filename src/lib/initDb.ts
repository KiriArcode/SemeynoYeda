import { db } from './db';
import { getSeedRecipes } from '../data/seedRecipes';
import { getSeedWeekMenu } from '../data/seedMenu';

/**
 * Проверяет, пуста ли база данных, и инициализирует её начальными данными
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const recipeCount = await db.table('recipes').count();

    if (recipeCount === 0) {
      console.log('База данных пуста, загружаем начальные рецепты...');
      await loadInitialRecipes();
      console.log('Создаём начальное меню недели...');
      await loadInitialMenu();
    }
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}

/**
 * Загружает начальные рецепты в базу данных (из документа меню Пн–Вс)
 */
async function loadInitialRecipes(): Promise<void> {
  const initialRecipes = getSeedRecipes();
  await db.table('recipes').bulkAdd(initialRecipes);
  console.log(`Загружено ${initialRecipes.length} начальных рецептов`);
}

/**
 * Создаёт начальное недельное меню (Пн–Вс, 4 приёма) по документу
 */
async function loadInitialMenu(): Promise<void> {
  const menu = getSeedWeekMenu();
  await db.table('menus').add(menu);
  console.log('Создано начальное меню недели');
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

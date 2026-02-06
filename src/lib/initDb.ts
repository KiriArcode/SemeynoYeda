import { db } from './db';
import type { Recipe } from '../data/schema';
import { nanoid } from 'nanoid';

/**
 * Проверяет, пуста ли база данных, и инициализирует её начальными данными
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Проверяем, есть ли рецепты
    const recipeCount = await db.table('recipes').count();
    
    // Если база пуста, загружаем начальные данные
    if (recipeCount === 0) {
      console.log('База данных пуста, загружаем начальные данные...');
      await loadInitialRecipes();
    }
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}

/**
 * Загружает начальные рецепты в базу данных
 */
async function loadInitialRecipes(): Promise<void> {
  const initialRecipes: Recipe[] = [
    {
      id: nanoid(),
      slug: 'kabachkovyj-sous',
      title: 'Кабачковый соус',
      subtitle: 'база для Коли',
      category: 'sauce',
      tags: ['gastritis-safe', 'freezable', 'quick'],
      suitableFor: 'kolya',
      prepTime: 5,
      cookTime: 15,
      totalTime: 20,
      servings: 6,
      ingredients: [
        { name: 'кабачок', amount: 300, unit: 'г' },
        { name: 'картофель', amount: 100, unit: 'г' },
        { name: 'оливковое масло', amount: 1, unit: 'ст.л.' },
        { name: 'вода', amount: 100, unit: 'мл' },
      ],
      steps: [
        {
          order: 1,
          text: 'Кабачок и картофель нарезать кубиками',
          duration: 5,
        },
        {
          order: 2,
          text: 'Отварить в воде до мягкости',
          equipment: {
            id: 'stove',
            label: 'Газовая плита',
            settings: 'средний огонь',
            duration: 12,
          },
          duration: 12,
          parallel: true,
          tip: 'Пока варится — можно формовать котлеты',
        },
        {
          order: 3,
          text: 'Пробить блендером до гладкости',
          equipment: {
            id: 'blender',
            label: 'Блендер',
            settings: 'насадка для пюре',
          },
          duration: 2,
        },
        {
          order: 4,
          text: 'Добавить оливковое масло, перемешать. Разлить по порциям',
          duration: 1,
        },
      ],
      equipment: ['stove', 'blender'],
      storage: { fridge: 4, freezer: 3, vacuumSealed: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      slug: 'svino-govyazhie-kotlety',
      title: 'Свино-говяжьи котлеты',
      subtitle: 'заготовка на 3 месяца',
      category: 'main',
      tags: ['freezable', 'soft-texture', 'prep-day'],
      suitableFor: 'both',
      prepTime: 30,
      cookTime: 15,
      totalTime: 45,
      servings: 20,
      ingredients: [
        { name: 'говядина', amount: 1, unit: 'кг' },
        { name: 'свинина (лопатка)', amount: 500, unit: 'г' },
        { name: 'лук', amount: 2, unit: 'шт', note: 'отварить!' },
        { name: 'соль', amount: 1, unit: 'по вкусу' },
      ],
      steps: [
        {
          order: 1,
          text: 'Лук отварить до мягкости (чтобы не раздражал желудок)',
          equipment: {
            id: 'stove',
            label: 'Газовая плита',
            settings: 'средний огонь',
            duration: 10,
          },
          duration: 10,
          parallel: true,
          tip: 'Пока варится лук — нарезать мясо кусками для гриндера',
        },
        {
          order: 2,
          text: 'Мясо нарезать кусками, пропустить через гриндер вместе с варёным луком',
          equipment: {
            id: 'grinder',
            label: 'Гриндер',
          },
          duration: 10,
        },
        {
          order: 3,
          text: 'Загрузить фарш в миксер, вымесить до однородности. Посолить',
          equipment: {
            id: 'mixer',
            label: 'Планетарный миксер',
            settings: 'насадка для теста, скорость 2',
          },
          duration: 5,
          tip: 'Миксер вымешивает лучше рук — котлеты будут нежнее',
        },
        {
          order: 4,
          text: 'Сформировать котлеты (~80г каждая), выложить на доску/поднос',
          duration: 10,
        },
      ],
      equipment: ['grinder', 'blender', 'mixer', 'oven', 'vacuum'],
      notes: 'Разогрев: пароварка 10 мин (лучше для Коли) или духовка 170°C 15 мин',
      storage: { fridge: 2, freezer: 2, vacuumSealed: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await db.table('recipes').bulkAdd(initialRecipes);
  console.log(`Загружено ${initialRecipes.length} начальных рецептов`);
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

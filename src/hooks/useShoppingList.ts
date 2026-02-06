import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { ShoppingItem, WeekMenu, Recipe, FreezerItem } from '../data/schema';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const allItems = await db.table('shopping').toArray();
      setItems(allItems);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateShoppingList(
    weekMenu: WeekMenu,
    missingIngredients: string[] = []
  ): Promise<ShoppingItem[]> {
    const recipesMap = new Map<string, Recipe>();
    const ingredientMap = new Map<string, ShoppingItem>();

    // Загрузить все рецепты из меню
    const recipeIds = new Set<string>();
    weekMenu.days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.recipes.forEach((recipe) => {
          recipeIds.add(recipe.recipeId);
        });
      });
    });

    const recipes = await db.table('recipes').bulkGet(Array.from(recipeIds));
    recipes.forEach((recipe) => {
      if (recipe) recipesMap.set(recipe.id, recipe);
    });

    // Собрать все ингредиенты из рецептов
    recipesMap.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const key = `${ingredient.name}_${ingredient.unit}`;
        const existing = ingredientMap.get(key);

        if (existing) {
          existing.totalAmount += ingredient.amount;
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeIds.push(recipe.id);
          }
        } else {
          ingredientMap.set(key, {
            ingredient: ingredient.name,
            totalAmount: ingredient.amount,
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            checked: false,
            recipeIds: [recipe.id],
            markedMissing: false,
            source: 'auto',
          });
        }
      });
    });

    // Check freezer inventory — subtract frozen components
    const freezerItems = await db.table('freezer').toArray() as FreezerItem[];
    const freezerRecipePortions = new Map<string, number>();
    for (const fi of freezerItems) {
      if (fi.portionsRemaining > 0 && fi.recipeId) {
        freezerRecipePortions.set(fi.recipeId, (freezerRecipePortions.get(fi.recipeId) || 0) + fi.portionsRemaining);
      }
    }

    // Mark items covered by freezer
    for (const day of weekMenu.days) {
      for (const meal of day.meals) {
        for (const entry of meal.recipes) {
          if (entry.usesFromFreezer && entry.usesFromFreezer.length > 0) {
            const recipe = recipesMap.get(entry.recipeId);
            if (recipe) {
              recipe.ingredients.forEach(ing => {
                const key = `${ing.name}_${ing.unit}`;
                const item = ingredientMap.get(key);
                if (item) {
                  item.coveredByFreezer = true;
                }
              });
            }
          }
        }
      }
    }

    // Добавить отсутствующие ингредиенты
    missingIngredients.forEach((ingredientName) => {
      const key = `${ingredientName}_шт`;
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          ingredient: ingredientName,
          totalAmount: 1,
          unit: 'шт',
          category: categorizeIngredient(ingredientName),
          checked: false,
          recipeIds: [],
          markedMissing: true,
          markedAt: new Date().toISOString(),
          source: 'missing',
        });
      } else {
        const item = ingredientMap.get(key)!;
        item.markedMissing = true;
        item.markedAt = new Date().toISOString();
        if (item.source === 'auto') {
          item.source = 'missing';
        }
      }
    });

    return Array.from(ingredientMap.values());
  }

  function categorizeIngredient(name: string): ShoppingItem['category'] {
    const lower = name.toLowerCase();
    if (lower.includes('мясо') || lower.includes('куриц') || lower.includes('говядин') || lower.includes('свинин') || lower.includes('рыб')) {
      return 'мясо';
    }
    if (lower.includes('молок') || lower.includes('сыр') || lower.includes('творог') || lower.includes('сметан') || lower.includes('йогурт')) {
      return 'молочка';
    }
    if (lower.includes('овощ') || lower.includes('лук') || lower.includes('морков') || lower.includes('помидор') || lower.includes('огурец') || lower.includes('кабачок') || lower.includes('картофел')) {
      return 'овощи';
    }
    if (lower.includes('рис') || lower.includes('гречк') || lower.includes('овсянк') || lower.includes('макарон') || lower.includes('крупа')) {
      return 'крупы';
    }
    return 'другое';
  }

  async function generateFromMenu(weekMenu: WeekMenu, missingIngredients: string[] = []) {
    const settings = weekMenu.shoppingSettings;
    if (settings?.autoGenerate) {
      const newItems = await generateShoppingList(weekMenu, missingIngredients);
      await db.table('shopping').bulkPut(newItems);
      await loadItems();
    }
  }

  async function addItem(item: Omit<ShoppingItem, 'checked' | 'source'> & { source?: ShoppingItem['source'] }) {
    const newItem: ShoppingItem = {
      ...item,
      checked: false,
      recipeIds: item.recipeIds || [],
      source: item.source || 'manual',
    };
    await db.table('shopping').put(newItem);
    await loadItems();
  }

  async function updateItem(ingredient: string, updates: Partial<ShoppingItem>) {
    await db.table('shopping').update(ingredient, updates);
    await loadItems();
  }

  async function toggleChecked(ingredient: string) {
    const item = await db.table('shopping').get(ingredient);
    if (item) {
      await db.table('shopping').update(ingredient, { checked: !item.checked });
      await loadItems();
    }
  }

  async function deleteItem(ingredient: string) {
    await db.table('shopping').delete(ingredient);
    await loadItems();
  }

  async function clearChecked() {
    const checkedItems = await db.table('shopping').where('checked').equals(1).toArray();
    await db.table('shopping').bulkDelete(checkedItems.map((item) => item.ingredient));
    await loadItems();
  }

  async function addMissingIngredients(missing: string[]) {
    console.log(`[useShoppingList] addMissingIngredients called with ${missing.length} items:`, missing);
    const existingItems = await db.table('shopping').toArray();
    const existingNames = new Set(existingItems.map((item) => item.ingredient));

    const newItems: ShoppingItem[] = missing
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        ingredient: name,
        totalAmount: 1,
        unit: 'шт',
        category: categorizeIngredient(name),
        checked: false,
        recipeIds: [],
        markedMissing: true,
        markedAt: new Date().toISOString(),
        source: 'missing',
      }));

    console.log(`[useShoppingList] ${newItems.length} new items to add (${existingNames.size} already exist)`);
    if (newItems.length > 0) {
      await db.table('shopping').bulkPut(newItems);
      await loadItems();
      console.log('[useShoppingList] Items added to DB');
    }
  }

  return {
    items,
    loading,
    loadItems,
    generateFromMenu,
    addItem,
    updateItem,
    toggleChecked,
    deleteItem,
    clearChecked,
    addMissingIngredients,
    generateShoppingList,
  };
}

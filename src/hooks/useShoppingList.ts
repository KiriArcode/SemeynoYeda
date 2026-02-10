import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { ShoppingItem, WeekMenu, Recipe } from '../data/schema';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const allItems = await dataService.shopping.list();
      setItems(allItems);
    } catch (error) {
      logger.error('Failed to load shopping list:', error);
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

    const recipeIds = new Set<string>();
    weekMenu.days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.recipes.forEach((recipe) => {
          recipeIds.add(recipe.recipeId);
        });
      });
    });

    const allRecipes = await dataService.recipes.list();
    allRecipes.forEach((recipe) => {
      if (recipeIds.has(recipe.id)) recipesMap.set(recipe.id, recipe);
    });

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
            id: crypto.randomUUID(),
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

    const freezerItems = await dataService.freezer.list();
    const freezerRecipePortions = new Map<string, number>();
    for (const fi of freezerItems) {
      if (fi.portionsRemaining > 0 && fi.recipeId) {
        freezerRecipePortions.set(
          fi.recipeId,
          (freezerRecipePortions.get(fi.recipeId) || 0) + fi.portionsRemaining
        );
      }
    }

    for (const day of weekMenu.days) {
      for (const meal of day.meals) {
        for (const entry of meal.recipes) {
          if (entry.usesFromFreezer && entry.usesFromFreezer.length > 0) {
            const recipe = recipesMap.get(entry.recipeId);
            if (recipe) {
              recipe.ingredients.forEach((ing) => {
                const key = `${ing.name}_${ing.unit}`;
                const item = ingredientMap.get(key);
                if (item) item.coveredByFreezer = true;
              });
            }
          }
        }
      }
    }

    missingIngredients.forEach((ingredientName) => {
      const key = `${ingredientName}_шт`;
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          id: crypto.randomUUID(),
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
        if (item.source === 'auto') item.source = 'missing';
      }
    });

    return Array.from(ingredientMap.values());
  }

  function categorizeIngredient(name: string): ShoppingItem['category'] {
    const lower = name.toLowerCase();
    if (
      lower.includes('мясо') ||
      lower.includes('куриц') ||
      lower.includes('говядин') ||
      lower.includes('свинин') ||
      lower.includes('рыб')
    )
      return 'мясо';
    if (
      lower.includes('молок') ||
      lower.includes('сыр') ||
      lower.includes('творог') ||
      lower.includes('сметан') ||
      lower.includes('йогурт')
    )
      return 'молочка';
    if (
      lower.includes('овощ') ||
      lower.includes('лук') ||
      lower.includes('морков') ||
      lower.includes('помидор') ||
      lower.includes('огурец') ||
      lower.includes('кабачок') ||
      lower.includes('картофел')
    )
      return 'овощи';
    if (
      lower.includes('рис') ||
      lower.includes('гречк') ||
      lower.includes('овсянк') ||
      lower.includes('макарон') ||
      lower.includes('крупа')
    )
      return 'крупы';
    return 'другое';
  }

  async function generateFromMenu(weekMenu: WeekMenu, missingIngredients: string[] = []) {
    const settings = weekMenu.shoppingSettings;
    if (settings?.autoGenerate) {
      const newItems = await generateShoppingList(weekMenu, missingIngredients);
      await dataService.shopping.bulkPut(newItems);
      await loadItems();
    }
  }

  async function addItem(
    item: Omit<ShoppingItem, 'checked' | 'source'> & { source?: ShoppingItem['source'] }
  ) {
    const newItem: ShoppingItem = {
      ...item,
      checked: false,
      recipeIds: item.recipeIds || [],
      source: item.source || 'manual',
    };
    await dataService.shopping.create(newItem);
    await loadItems();
  }

  async function updateItem(ingredient: string, updates: Partial<ShoppingItem>) {
    await dataService.shopping.update(ingredient, updates);
    await loadItems();
  }

  async function toggleChecked(ingredient: string) {
    const allItems = await dataService.shopping.list();
    const item = allItems.find((i) => i.ingredient === ingredient);
    if (item) {
      await dataService.shopping.update(ingredient, { checked: !item.checked });
      await loadItems();
    }
  }

  async function deleteItem(ingredient: string) {
    await dataService.shopping.delete(ingredient);
    await loadItems();
  }

  async function clearChecked() {
    const allItems = await dataService.shopping.list();
    const remaining = allItems.filter((i) => !i.checked);
    await dataService.shopping.bulkPut(remaining);
    await loadItems();
  }

  async function addMissingIngredients(missing: string[]) {
    const existingItems = await dataService.shopping.list();
    const existingNames = new Set(existingItems.map((i) => i.ingredient));

    const newItems: ShoppingItem[] = missing
      .filter((name) => !existingNames.has(name))
      .map((name) => ({
        id: crypto.randomUUID(),
        ingredient: name,
        totalAmount: 1,
        unit: 'шт' as const,
        category: categorizeIngredient(name),
        checked: false,
        recipeIds: [] as string[],
        markedMissing: true,
        markedAt: new Date().toISOString(),
        source: 'missing' as const,
      }));

    if (newItems.length > 0) {
      const merged = [...existingItems, ...newItems];
      await dataService.shopping.bulkPut(merged);
      await loadItems();
    }
  }

  async function bulkToggleChecked(ingredients: string[]) {
    if (ingredients.length === 0) return;
    const allItems = await dataService.shopping.list();
    const updatedItems = allItems.map((item) => {
      if (ingredients.includes(item.ingredient)) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    await dataService.shopping.bulkPut(updatedItems);
    await loadItems();
  }

  async function bulkDelete(ingredients: string[]) {
    if (ingredients.length === 0) return;
    const allItems = await dataService.shopping.list();
    const remainingItems = allItems.filter((item) => !ingredients.includes(item.ingredient));
    await dataService.shopping.bulkPut(remainingItems);
    await loadItems();
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
    bulkToggleChecked,
    bulkDelete,
  };
}

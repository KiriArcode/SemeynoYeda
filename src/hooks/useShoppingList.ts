import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import { applyMinWeightOrVolume, getPortionsPerRecipeFromMenu } from '../lib/shoppingListUtils';
import type { ShoppingItem, WeekMenu, Recipe } from '../data/schema';

/** Добавляет из generated только те позиции, которых ещё нет в existing (по паре ingredient + unit). Ручные и missing из existing сохраняются. */
export function mergeGeneratedIntoList(
  existingItems: ShoppingItem[],
  generatedItems: ShoppingItem[]
): ShoppingItem[] {
  const existingKeys = new Set(existingItems.map((i) => `${i.ingredient}_${i.unit}`));
  const result = [...existingItems];
  for (const g of generatedItems) {
    const key = `${g.ingredient}_${g.unit}`;
    if (!existingKeys.has(key)) {
      result.push(g);
      existingKeys.add(key);
    }
  }
  return result;
}

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
    console.log('[generateShoppingList] recipeIds from menu', Array.from(recipeIds));
    logger.log('[generateShoppingList] recipeIds from menu', Array.from(recipeIds));

    const portionsByRecipe = getPortionsPerRecipeFromMenu(weekMenu);

    const allRecipes = await dataService.recipes.list();
    allRecipes.forEach((recipe) => {
      if (recipeIds.has(recipe.id)) recipesMap.set(recipe.id, recipe);
    });
    console.log('[generateShoppingList] recipesMap size', recipesMap.size);
    logger.log('[generateShoppingList] recipesMap size', recipesMap.size);

    recipesMap.forEach((recipe) => {
      const totalPortions = portionsByRecipe.get(recipe.id) ?? 1;
      const multiplier = totalPortions / recipe.servings;
      console.log('[generateShoppingList] recipe portions', {
        recipeId: recipe.id,
        title: recipe.title,
        servings: recipe.servings,
        totalPortions,
        multiplier,
      });
      logger.log('[generateShoppingList] recipe portions', {
        recipeId: recipe.id,
        title: recipe.title,
        servings: recipe.servings,
        totalPortions,
        multiplier,
      });
      recipe.ingredients.forEach((ingredient) => {
        const key = `${ingredient.name}_${ingredient.unit}`;
        const amount = ingredient.amount * multiplier;
        const existing = ingredientMap.get(key);

        if (existing) {
          existing.totalAmount += amount;
          if (!existing.recipeIds.includes(recipe.id)) {
            existing.recipeIds.push(recipe.id);
          }
          console.log('[generateShoppingList] merge ingredient', { key, amount, newTotal: existing.totalAmount });
          logger.log('[generateShoppingList] merge ingredient', { key, amount, newTotal: existing.totalAmount });
        } else {
          ingredientMap.set(key, {
            id: crypto.randomUUID(),
            ingredient: ingredient.name,
            totalAmount: amount,
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            checked: false,
            recipeIds: [recipe.id],
            markedMissing: false,
            source: 'auto',
          });
          console.log('[generateShoppingList] new ingredient', { key, amount });
          logger.log('[generateShoppingList] new ingredient', { key, amount });
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

    return Array.from(ingredientMap.values()).map((item) => ({
      ...item,
      ...applyMinWeightOrVolume(item),
    }));
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
      const existing = await dataService.shopping.list();
      const generated = await generateShoppingList(weekMenu, missingIngredients);
      const merged = mergeGeneratedIntoList(existing, generated);
      await dataService.shopping.bulkPut(merged);
      await loadItems();
    }
  }

  async function addItem(
    item: Omit<ShoppingItem, 'checked' | 'source' | 'id'> & { source?: ShoppingItem['source']; id?: string }
  ) {
    const newItem: ShoppingItem = {
      ...item,
      id: item.id ?? crypto.randomUUID(),
      checked: false,
      recipeIds: item.recipeIds || [],
      source: item.source || 'manual',
    };
    await dataService.shopping.create(newItem);
    await loadItems();
  }

  async function updateItem(id: string, updates: Partial<ShoppingItem>) {
    await dataService.shopping.update(id, updates);
    await loadItems();
  }

  async function toggleChecked(id: string) {
    const item = items.find((i) => i.id === id);
    if (item) {
      await dataService.shopping.update(id, { checked: !item.checked });
      await loadItems();
    }
  }

  async function deleteItem(id: string) {
    await dataService.shopping.delete(id);
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

  async function bulkToggleChecked(ids: string[]) {
    if (ids.length === 0) return;
    const allItems = await dataService.shopping.list();
    const idSet = new Set(ids);
    const updatedItems = allItems.map((item) =>
      idSet.has(item.id) ? { ...item, checked: !item.checked } : item
    );
    await dataService.shopping.bulkPut(updatedItems);
    await loadItems();
  }

  async function bulkDelete(ids: string[]) {
    if (ids.length === 0) return;
    const allItems = await dataService.shopping.list();
    const idSet = new Set(ids);
    const remainingItems = allItems.filter((item) => !idSet.has(item.id));
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

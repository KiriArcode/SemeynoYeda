import { useState, useCallback } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { Ingredient, IngredientAvailability } from '../data/schema';
import { useShoppingList } from './useShoppingList';

export function useIngredientAvailability() {
  const { addMissingIngredients } = useShoppingList();
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, IngredientAvailability>>(
    new Map()
  );

  const markIngredientMissing = useCallback(
    async (ingredient: string) => {
      logger.log(`[useIngredientAvailability] markMissing: "${ingredient}"`);
      setAvailabilityMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(ingredient, 'missing');
        return newMap;
      });

      // Добавить в список покупок
      await addMissingIngredients([ingredient]);
    },
    [addMissingIngredients]
  );

  const markIngredientAvailable = useCallback((ingredient: string) => {
    logger.log(`[useIngredientAvailability] markAvailable: "${ingredient}"`);
    setAvailabilityMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(ingredient, 'available');
      return newMap;
    });
  }, []);

  const checkIngredientAvailability = useCallback(
    async (ingredients: Ingredient[]): Promise<Map<string, IngredientAvailability>> => {
      const result = new Map<string, IngredientAvailability>();

      // Проверить каждый ингредиент
      for (const ingredient of ingredients) {
        // Если уже есть в availabilityMap, использовать это значение
        if (availabilityMap.has(ingredient.name)) {
          result.set(ingredient.name, availabilityMap.get(ingredient.name)!);
        } else {
          // По умолчанию - unknown
          result.set(ingredient.name, 'unknown');
        }
      }

      return result;
    },
    [availabilityMap]
  );

  const getMissingIngredients = useCallback(
    async (recipeIds: string[]): Promise<string[]> => {
      const allRecipes = await dataService.recipes.list();
      const recipes = allRecipes.filter((r) => recipeIds.includes(r.id));
      const missing: string[] = [];

      recipes.forEach((recipe) => {
        if (!recipe) return;

        recipe.ingredients.forEach((ingredient: Ingredient) => {
          const availability = availabilityMap.get(ingredient.name);
          if (availability === 'missing') {
            if (!missing.includes(ingredient.name)) {
              missing.push(ingredient.name);
            }
          }
        });
      });

      return missing;
    },
    [availabilityMap]
  );

  const addMissingToShoppingList = useCallback(
    async (missing: string[]) => {
      await addMissingIngredients(missing);
    },
    [addMissingIngredients]
  );

  const resetAvailability = useCallback(() => {
    setAvailabilityMap(new Map());
  }, []);

  return {
    availabilityMap,
    markIngredientMissing,
    markIngredientAvailable,
    checkIngredientAvailability,
    getMissingIngredients,
    addMissingToShoppingList,
    resetAvailability,
  };
}

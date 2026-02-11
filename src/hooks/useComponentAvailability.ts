import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { FreezerItem } from '../data/schema';
import { findRecipeByIngredientName } from '../lib/recipeNesting';
import type { Recipe, Ingredient } from '../data/schema';

interface ComponentAvailability {
  isAvailable: boolean;
  freezerItem: FreezerItem | null;
  isFrozen: boolean;
  recipe: Recipe | null;
}

/**
 * Хук для проверки наличия компонента рецепта в морозилке
 */
export function useComponentAvailability(
  ingredient: Ingredient,
  allRecipes: Recipe[]
): ComponentAvailability {
  const [availability, setAvailability] = useState<ComponentAvailability>({
    isAvailable: false,
    freezerItem: null,
    isFrozen: false,
    recipe: null,
  });

  useEffect(() => {
    async function checkAvailability() {
      try {
        // Проверяем, является ли ингредиент рецептом-компонентом
        const componentRecipe = findRecipeByIngredientName(ingredient.name, allRecipes);
        
        if (!componentRecipe) {
          setAvailability({
            isAvailable: false,
            freezerItem: null,
            isFrozen: false,
            recipe: null,
          });
          return;
        }

        // Ищем компонент в морозилке по recipeId
        const freezerItems = await dataService.freezer.list();
        const matchingItem = freezerItems.find(
          item => item.recipeId === componentRecipe.id && item.portionsRemaining > 0
        );

        if (matchingItem) {
          setAvailability({
            isAvailable: true,
            freezerItem: matchingItem,
            isFrozen: true,
            recipe: componentRecipe,
          });
        } else {
          setAvailability({
            isAvailable: false,
            freezerItem: null,
            isFrozen: false,
            recipe: componentRecipe,
          });
        }
      } catch (error) {
        logger.error('[useComponentAvailability] Error checking availability:', error);
        setAvailability({
          isAvailable: false,
          freezerItem: null,
          isFrozen: false,
          recipe: null,
        });
      }
    }

    checkAvailability();
  }, [ingredient.name, allRecipes]);

  return availability;
}

/**
 * Хук для проверки доступности нескольких компонентов
 */
export function useMultipleComponentAvailability(
  ingredients: Ingredient[],
  allRecipes: Recipe[]
): Map<string, ComponentAvailability> {
  const [availabilities, setAvailabilities] = useState<Map<string, ComponentAvailability>>(new Map());

  useEffect(() => {
    async function checkAllAvailability() {
      const results = new Map<string, ComponentAvailability>();

      for (const ingredient of ingredients) {
        try {
          const componentRecipe = findRecipeByIngredientName(ingredient.name, allRecipes);
          
          if (!componentRecipe) {
            results.set(ingredient.name, {
              isAvailable: false,
              freezerItem: null,
              isFrozen: false,
              recipe: null,
            });
            continue;
          }

          const freezerItems = await dataService.freezer.list();
          const matchingItem = freezerItems.find(
            item => item.recipeId === componentRecipe.id && item.portionsRemaining > 0
          );

          results.set(ingredient.name, {
            isAvailable: !!matchingItem,
            freezerItem: matchingItem || null,
            isFrozen: !!matchingItem,
            recipe: componentRecipe,
          });
        } catch (error) {
          logger.error(`[useMultipleComponentAvailability] Error checking ${ingredient.name}:`, error);
          results.set(ingredient.name, {
            isAvailable: false,
            freezerItem: null,
            isFrozen: false,
            recipe: null,
          });
        }
      }

      setAvailabilities(results);
    }

    checkAllAvailability();
  }, [ingredients, allRecipes]);

  return availabilities;
}

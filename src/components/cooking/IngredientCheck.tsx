import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { Recipe, Ingredient, IngredientAvailability } from '../../data/schema';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface IngredientCheckProps {
  recipeIds: string[];
  onComplete?: (missing: string[]) => void;
}

export function IngredientCheck({ recipeIds, onComplete }: IngredientCheckProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Map<string, Ingredient & { availability: IngredientAvailability; recipeTitles: string[] }>>(new Map());
  const [loading, setLoading] = useState(true);
  const { availabilityMap, markIngredientMissing, markIngredientAvailable, addMissingToShoppingList } = useIngredientAvailability();

  useEffect(() => {
    loadRecipes();
  }, [recipeIds]);

  useEffect(() => {
    updateIngredientsAvailability();
  }, [recipes, availabilityMap]);

  async function loadRecipes() {
    try {
      const loadedRecipes = await db.table('recipes').bulkGet(recipeIds);
      const validRecipes = loadedRecipes.filter((r): r is Recipe => r !== undefined);
      setRecipes(validRecipes);

      // Собрать все уникальные ингредиенты
      const ingredientMap = new Map<string, Ingredient & { recipeTitles: string[] }>();
      validRecipes.forEach((recipe) => {
        recipe.ingredients.forEach((ingredient) => {
          const key = ingredient.name;
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            if (!existing.recipeTitles.includes(recipe.title)) {
              existing.recipeTitles.push(recipe.title);
            }
          } else {
            ingredientMap.set(key, {
              ...ingredient,
              recipeTitles: [recipe.title],
            });
          }
        });
      });

      const ingredientsWithAvailability = new Map();
      ingredientMap.forEach((ingredient, name) => {
        ingredientsWithAvailability.set(name, {
          ...ingredient,
          availability: availabilityMap.get(name) || 'unknown',
        });
      });
      setIngredients(ingredientsWithAvailability);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateIngredientsAvailability() {
    setIngredients((prev) => {
      const updated = new Map(prev);
      updated.forEach((ingredient, name) => {
        updated.set(name, {
          ...ingredient,
          availability: availabilityMap.get(name) || 'unknown',
        });
      });
      return updated;
    });
  }

  async function handleAvailabilityChange(name: string, availability: IngredientAvailability) {
    console.log(`[IngredientCheck] Set "${name}" -> ${availability}`);
    if (availability === 'missing') {
      await markIngredientMissing(name);
    } else if (availability === 'available') {
      markIngredientAvailable(name);
    }
  }

  async function handleAddMissingToShoppingList() {
    const missing = Array.from(ingredients.values())
      .filter((ing) => ing.availability === 'missing')
      .map((ing) => ing.name);
    
    console.log(`[IngredientCheck] Add ${missing.length} missing to shopping list:`, missing);
    if (missing.length > 0) {
      await addMissingToShoppingList(missing);
      console.log('[IngredientCheck] Added to shopping list successfully');
      if (onComplete) {
        onComplete(missing);
      }
    }
  }

  function getAvailabilityIcon(availability: IngredientAvailability) {
    switch (availability) {
      case 'available':
        return <CheckCircle2 className="w-5 h-5 text-portal" />;
      case 'missing':
        return <XCircle className="w-5 h-5 text-ramen" />;
      default:
        return <HelpCircle className="w-5 h-5 text-text-dim" />;
    }
  }

  function getAvailabilityColor(availability: IngredientAvailability) {
    switch (availability) {
      case 'available':
        return 'border-portal bg-portal-mist';
      case 'missing':
        return 'border-ramen bg-ramen/10';
      default:
        return 'border-nebula bg-dimension';
    }
  }

  const missingCount = Array.from(ingredients.values()).filter((ing) => ing.availability === 'missing').length;

  if (loading) {
    return (
      <div className="bg-dimension border border-nebula rounded-card p-4">
        <div className="text-text-mid font-body">Загрузка ингредиентов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
        <h3 className="font-heading text-xl font-bold text-text-light mb-4">
          Проверка ингредиентов
        </h3>

        {missingCount > 0 && (
          <div className="mb-4 p-3 bg-ramen/10 border border-ramen rounded-button">
            <p className="text-sm font-body text-ramen">
              Не хватает ингредиентов в этом измерении: {missingCount}
            </p>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Array.from(ingredients.values()).map((ingredient) => (
            <div
              key={ingredient.name}
              className={`flex items-center justify-between p-3 border rounded-card ${getAvailabilityColor(ingredient.availability)}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getAvailabilityIcon(ingredient.availability)}
                  <span className="font-body text-text-light font-medium">
                    {ingredient.name}
                  </span>
                </div>
                <div className="ml-7 text-sm text-text-dim font-body">
                  {ingredient.amount} {ingredient.unit}
                  {ingredient.recipeTitles.length > 0 && (
                    <span className="ml-2">· {ingredient.recipeTitles.join(', ')}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAvailabilityChange(ingredient.name, 'available')}
                  className={`px-3 py-1 rounded-button text-xs font-heading font-semibold transition-colors ${
                    ingredient.availability === 'available'
                      ? 'bg-portal text-void'
                      : 'bg-rift text-text-mid hover:bg-nebula'
                  }`}
                >
                  Есть
                </button>
                <button
                  onClick={() => handleAvailabilityChange(ingredient.name, 'missing')}
                  className={`px-3 py-1 rounded-button text-xs font-heading font-semibold transition-colors ${
                    ingredient.availability === 'missing'
                      ? 'bg-ramen text-void'
                      : 'bg-rift text-text-mid hover:bg-nebula'
                  }`}
                >
                  Нет
                </button>
              </div>
            </div>
          ))}
        </div>

        {missingCount > 0 && (
          <button
            onClick={handleAddMissingToShoppingList}
            className="mt-4 w-full bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold py-2 px-4 rounded-button shadow-glow hover:shadow-glow/80 transition-shadow"
          >
            Добавить в список покупок
          </button>
        )}

        {missingCount === 0 && Array.from(ingredients.values()).every((ing) => ing.availability !== 'unknown') && (
          <div className="mt-4 p-3 bg-portal-mist border border-portal rounded-button">
            <p className="text-sm font-body text-portal">
              Ингредиенты проверены, Морти
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

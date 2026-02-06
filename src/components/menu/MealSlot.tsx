import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { MealSlot as MealSlotType, Recipe } from '../../data/schema';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { IngredientCheck } from '../cooking/IngredientCheck';
import { AlertTriangle } from 'lucide-react';

interface MealSlotProps {
  slot: MealSlotType;
  date: string;
  onUpdate?: (updatedSlot: MealSlotType) => void;
}

export function MealSlot({ slot, onUpdate }: MealSlotProps) {
  const [showIngredientCheck, setShowIngredientCheck] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const { getMissingIngredients } = useIngredientAvailability();
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);

  const recipeIds = slot.recipes.map((r) => r.recipeId);

  // Подгружать рецепты при отображении слота, чтобы названия блюд были видны сразу
  useEffect(() => {
    if (recipeIds.length === 0) {
      setRecipes([]);
      setMissingIngredients([]);
      return;
    }
    loadRecipes();
  }, [JSON.stringify(recipeIds)]);

  async function loadRecipes() {
    try {
      const loadedRecipes = await db.table('recipes').bulkGet(recipeIds);
      const validRecipes = loadedRecipes.filter((r): r is Recipe => r !== undefined);
      setRecipes(validRecipes);

      // Проверить отсутствующие ингредиенты
      const missing = await getMissingIngredients(recipeIds);
      setMissingIngredients(missing);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }

  function handleCheckIngredients() {
    loadRecipes();
    setShowIngredientCheck(true);
  }

  function handleIngredientCheckComplete(missing: string[]) {
    setMissingIngredients(missing);
    setShowIngredientCheck(false);

    // Обновить слот с отсутствующими ингредиентами
    if (onUpdate) {
      const updatedSlot: MealSlotType = {
        ...slot,
        recipes: slot.recipes.map((recipe) => ({
          ...recipe,
          missingIngredients: missing,
        })),
      };
      onUpdate(updatedSlot);
    }
  }

  const hasMissingIngredients = missingIngredients.length > 0 || slot.recipes.some((r) => r.missingIngredients && r.missingIngredients.length > 0);

  return (
    <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-heading font-semibold text-text-light mb-2">
            {slot.mealType === 'breakfast' && 'Завтрак'}
            {slot.mealType === 'lunch' && 'Обед'}
            {slot.mealType === 'snack' && 'Полдник'}
            {slot.mealType === 'dinner' && 'Ужин'}
          </h4>
          {recipes.length > 0 && (
            <div className="space-y-1">
              {recipes.map((recipe, index) => {
                const entry = slot.recipes[index];
                return (
                  <div key={`${recipe.id}-${index}`} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-body text-text-mid">{recipe.title}</span>
                    {entry?.variation && (
                      <span className="text-xs text-text-dim font-body">({entry.variation})</span>
                    )}
                    {entry?.forWhom && (
                      <span className={`text-xs px-2 py-0.5 rounded-pill font-heading font-semibold ${
                        entry.forWhom === 'kolya'
                          ? 'bg-portal/20 text-portal'
                          : entry.forWhom === 'kristina'
                          ? 'bg-ramen/20 text-ramen'
                          : 'bg-plasma/20 text-plasma'
                      }`}>
                        {entry.forWhom === 'kolya' && 'Коля'}
                        {entry.forWhom === 'kristina' && 'Кристина'}
                        {entry.forWhom === 'both' && 'Оба'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasMissingIngredients && (
          <div className="flex items-center gap-1 text-ramen">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-body">Не хватает ингредиентов</span>
          </div>
        )}
      </div>

      <button
        onClick={handleCheckIngredients}
        className="w-full mt-2 bg-rift border border-nebula text-text-light font-heading font-semibold text-xs py-2 px-3 rounded-button hover:bg-nebula hover:border-portal/30 transition-colors"
      >
        Проверить ингредиенты
      </button>

      {showIngredientCheck && (
        <div className="mt-4">
          <IngredientCheck
            recipeIds={recipeIds}
            onComplete={handleIngredientCheckComplete}
          />
        </div>
      )}
    </div>
  );
}

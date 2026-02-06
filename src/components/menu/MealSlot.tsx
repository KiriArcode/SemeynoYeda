import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import type { MealSlot as MealSlotType, Recipe } from '../../data/schema';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { IngredientCheck } from '../cooking/IngredientCheck';
import { AlertTriangle, X } from 'lucide-react';

interface MealSlotProps {
  slot: MealSlotType;
  date: string;
  onUpdate?: (updatedSlot: MealSlotType) => void;
}

const MEAL_LABELS: Record<string, { label: string; icon: string }> = {
  breakfast: { label: 'Завтрак', icon: '🌅' },
  lunch: { label: 'Обед', icon: '🍽️' },
  snack: { label: 'Полдник', icon: '🍎' },
  dinner: { label: 'Ужин', icon: '🌙' },
};

export function MealSlot({ slot, onUpdate }: MealSlotProps) {
  const [showIngredientCheck, setShowIngredientCheck] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const { getMissingIngredients } = useIngredientAvailability();
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);

  const recipeIds = slot.recipes.map((r) => r.recipeId);
  const meal = MEAL_LABELS[slot.mealType] || { label: slot.mealType, icon: '🍴' };

  // Подгружать рецепты при отображении слота
  useEffect(() => {
    if (recipeIds.length === 0) {
      setRecipes([]);
      setMissingIngredients([]);
      setRecipesError(null);
      return;
    }
    let cancelled = false;
    setRecipesLoading(true);
    setRecipesError(null);
    console.log(`[MealSlot:${slot.mealType}] Loading ${recipeIds.length} recipes...`);
    (async () => {
      try {
        const loadedRecipes = await db.table('recipes').bulkGet(recipeIds);
        const validRecipes = (loadedRecipes || []).filter((r): r is Recipe => r != null && typeof r === 'object' && 'id' in r && 'title' in r);
        if (!cancelled) {
          setRecipes(validRecipes);
          console.log(`[MealSlot:${slot.mealType}] Loaded ${validRecipes.length}/${recipeIds.length} recipes`);
        }
        const missing = await getMissingIngredients(recipeIds);
        if (!cancelled) {
          setMissingIngredients(missing);
        }
      } catch (error) {
        if (!cancelled) {
          setRecipes([]);
          setRecipesError(error instanceof Error ? error.message : 'Ошибка загрузки рецептов');
          console.error(`[MealSlot:${slot.mealType}] Failed to load recipes`, { recipeIds, error });
        }
      } finally {
        if (!cancelled) {
          setRecipesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(recipeIds)]);

  function handleCheckIngredients() {
    console.log(`[MealSlot:${slot.mealType}] Opening ingredient check`);
    setShowIngredientCheck(true);
  }

  function handleCloseIngredientCheck() {
    console.log(`[MealSlot:${slot.mealType}] Closing ingredient check`);
    setShowIngredientCheck(false);
  }

  function handleIngredientCheckComplete(missing: string[]) {
    console.log(`[MealSlot:${slot.mealType}] Ingredient check complete, missing: ${missing.length}`);
    setMissingIngredients(missing);
    setShowIngredientCheck(false);

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

  // Цветная полоска слева по профилю
  const forWhomSet = new Set(slot.recipes.map((r) => r.forWhom));
  const borderClass =
    forWhomSet.size === 1 && forWhomSet.has('kolya') ? 'meal-border-kolya'
    : forWhomSet.size === 1 && forWhomSet.has('kristina') ? 'meal-border-kristina'
    : forWhomSet.size === 1 && forWhomSet.has('both') ? 'meal-border-both'
    : 'meal-border-mixed';

  return (
    <div className={`bg-dimension border border-nebula rounded-card p-4 shadow-card animate-card-appear ${borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-heading font-semibold text-text-light mb-2 flex items-center gap-2">
            <span>{meal.icon}</span>
            <span>{meal.label}</span>
          </h4>
          {recipesLoading && recipeIds.length > 0 && (
            <p className="text-sm font-body text-text-dim">Загрузка рецептов...</p>
          )}
          {recipesError && (
            <p className="text-xs font-body text-ramen">{recipesError}</p>
          )}
          {!recipesLoading && recipes.length > 0 && (
            <div className="space-y-1.5">
              {recipes.map((recipe, index) => {
                const entry = slot.recipes[index];
                return (
                  <div key={`${recipe.id}-${index}`} className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/recipe/${recipe.id}`}
                      onClick={() => console.log(`[MealSlot] Navigate to recipe: ${recipe.title}`)}
                      className="text-sm font-body text-text-mid hover:text-portal transition-colors underline decoration-nebula hover:decoration-portal"
                    >
                      {recipe.title}
                    </Link>
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
              {slot.recipes.length > recipes.length && (
                <p className="text-xs font-body text-text-dim">Рецепт не найден</p>
              )}
            </div>
          )}
        </div>

        {hasMissingIngredients && (
          <div className="flex items-center gap-1 text-ramen">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-body">Не хватает</span>
          </div>
        )}
      </div>

      {!showIngredientCheck && (
        <button
          onClick={handleCheckIngredients}
          className="w-full mt-2 bg-rift border border-nebula text-text-light font-heading font-semibold text-xs py-2 px-3 rounded-button hover:bg-nebula hover:border-portal/30 transition-colors"
        >
          Проверить ингредиенты
        </button>
      )}

      {showIngredientCheck && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-semibold text-text-dim">Ингредиенты для {meal.label.toLowerCase()}а</span>
            <button
              onClick={handleCloseIngredientCheck}
              className="flex items-center gap-1 px-2 py-1 text-xs font-heading font-semibold text-text-mid bg-rift border border-nebula rounded-button hover:bg-nebula hover:text-ramen hover:border-ramen/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Закрыть
            </button>
          </div>
          <IngredientCheck
            recipeIds={recipeIds}
            onComplete={handleIngredientCheckComplete}
          />
        </div>
      )}
    </div>
  );
}

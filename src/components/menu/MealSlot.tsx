import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import type { MealSlot as MealSlotType, Recipe } from '../../data/schema';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { IngredientCheck } from '../cooking/IngredientCheck';
import { SwapModal } from './SwapModal';
import { AlertTriangle, X, Snowflake, ArrowLeftRight, Coffee } from 'lucide-react';

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

const MEMBER_LABELS: Record<string, string> = {
  kolya: 'Коля',
  kristina: 'Кристина',
  both: 'Оба',
};


export function MealSlot({ slot, onUpdate }: MealSlotProps) {
  const [showIngredientCheck, setShowIngredientCheck] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const { getMissingIngredients } = useIngredientAvailability();
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  const recipeIds = slot.recipes.map((r) => r.recipeId);
  const meal = MEAL_LABELS[slot.mealType] || { label: slot.mealType, icon: '🍴' };

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
    return () => { cancelled = true; };
  }, [JSON.stringify(recipeIds)]);

  function handleSwapRecipe(index: number) {
    console.log(`[MealSlot:${slot.mealType}] Opening swap for index ${index}`);
    setSwapIndex(index);
  }

  function handleSwapSelect(newRecipe: Recipe) {
    if (swapIndex === null || !onUpdate) return;
    console.log(`[MealSlot:${slot.mealType}] Swapping recipe at index ${swapIndex} to ${newRecipe.title}`);
    const updatedSlot: MealSlotType = {
      ...slot,
      recipes: slot.recipes.map((r, i) => i === swapIndex ? { ...r, recipeId: newRecipe.id } : r),
    };
    onUpdate(updatedSlot);
    setSwapIndex(null);
  }

  function handleIngredientCheckComplete(missing: string[]) {
    console.log(`[MealSlot:${slot.mealType}] Ingredient check complete, missing: ${missing.length}`);
    setMissingIngredients(missing);
    setShowIngredientCheck(false);
    if (onUpdate) {
      const updatedSlot: MealSlotType = {
        ...slot,
        recipes: slot.recipes.map((recipe) => ({ ...recipe, missingIngredients: missing })),
      };
      onUpdate(updatedSlot);
    }
  }

  const hasMissingIngredients = missingIngredients.length > 0 || slot.recipes.some((r) => r.missingIngredients && r.missingIngredients.length > 0);
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
          <h4 className="font-heading font-semibold text-text-light mb-2 flex items-center" style={{ gap: '8px' }}>
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
                const isFrozen = entry?.usesFromFreezer && entry.usesFromFreezer.length > 0;
                const isCoffeeOnly = entry?.coffeeOnly;
                return (
                  <div key={`${recipe.id}-${index}`} className="flex flex-wrap items-center" style={{ gap: '8px' }}>
                    {isCoffeeOnly ? (
                      <span className="text-sm font-body text-text-dim flex items-center" style={{ gap: '4px' }}>
                        <Coffee className="w-3.5 h-3.5" /> Только кофе
                      </span>
                    ) : (
                      <>
                        <Link
                          to={`/recipe/${recipe.id}`}
                          onClick={() => console.log(`[MealSlot] Navigate to recipe: ${recipe.title}`)}
                          className="text-sm font-body text-text-mid hover:text-portal transition-colors underline decoration-nebula hover:decoration-portal"
                        >
                          {recipe.title}
                        </Link>
                        {isFrozen && (
                          <span title="Из морозилки"><Snowflake className="w-3.5 h-3.5 text-frost" /></span>
                        )}
                        {/* Reheating hint for frozen items */}
                        {isFrozen && recipe.reheating && entry?.forWhom && (
                          (() => {
                            const rh = recipe.reheating.find(r => r.forWhom === entry.forWhom || r.forWhom === 'both');
                            return rh ? (
                              <span className="text-[10px] font-mono text-frost">{rh.method}</span>
                            ) : null;
                          })()
                        )}
                      </>
                    )}
                    {entry?.variation && (
                      <span className="text-xs text-text-dim font-body">({entry.variation})</span>
                    )}
                    {entry?.forWhom && (
                      <span className={`text-xs px-3 py-1 font-heading font-semibold border ${
                        entry.forWhom === 'kolya'
                          ? 'bg-portal/15 text-portal border-portal/40'
                          : entry.forWhom === 'kristina'
                          ? 'bg-ramen/15 text-ramen border-ramen/40'
                          : 'bg-plasma/15 text-plasma border-plasma/40'
                      }`} style={{ borderRadius: '9999px' }}>
                        {MEMBER_LABELS[entry.forWhom]}
                      </span>
                    )}
                    {/* Packable icon for lunch */}
                    {slot.mealType === 'lunch' && recipe.tags?.includes('packable') && (
                      <span className="text-[10px] text-miso" title="Можно взять с собой">🥡</span>
                    )}
                    {/* Swap button */}
                    {onUpdate && (
                      <button onClick={() => handleSwapRecipe(index)}
                        className="text-text-ghost hover:text-portal transition-colors p-0.5" title="Заменить блюдо">
                        <ArrowLeftRight className="w-3 h-3" />
                      </button>
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
          <div className="flex items-center text-ramen" style={{ gap: '4px' }}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-body">Не хватает</span>
          </div>
        )}
      </div>

      {!showIngredientCheck && (
        <button
          onClick={() => { console.log(`[MealSlot:${slot.mealType}] Opening ingredient check`); setShowIngredientCheck(true); }}
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
              onClick={() => { console.log(`[MealSlot:${slot.mealType}] Closing ingredient check`); setShowIngredientCheck(false); }}
              className="flex items-center px-2 py-1 text-xs font-heading font-semibold text-text-mid bg-rift border border-nebula rounded-button hover:bg-nebula hover:text-ramen hover:border-ramen/30 transition-colors"
              style={{ gap: '4px' }}
            >
              <X className="w-3.5 h-3.5" /> Закрыть
            </button>
          </div>
          <IngredientCheck recipeIds={recipeIds} onComplete={handleIngredientCheckComplete} />
        </div>
      )}

      {/* Swap modal */}
      {swapIndex !== null && (
        <SwapModal
          isOpen={true}
          onClose={() => setSwapIndex(null)}
          onSelect={handleSwapSelect}
          currentRecipeId={slot.recipes[swapIndex]?.recipeId}
          filterForWhom={slot.recipes[swapIndex]?.forWhom}
          filterMealType={slot.mealType}
        />
      )}
    </div>
  );
}

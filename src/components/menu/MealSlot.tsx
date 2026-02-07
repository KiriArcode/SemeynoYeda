import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/db';
import type { MealSlot as MealSlotType, Recipe } from '../../data/schema';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { IngredientCheck } from '../cooking/IngredientCheck';
import { SwapModal } from './SwapModal';
import { AlertTriangle, X, Snowflake, ArrowLeftRight, Coffee, ChevronDown } from 'lucide-react';

interface MealSlotProps {
  slot: MealSlotType;
  date: string;
  onUpdate?: (updatedSlot: MealSlotType) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const MEAL_LABELS: Record<string, { label: string; icon: string }> = {
  breakfast: { label: 'Завтрак', icon: '🌅' },
  lunch: { label: 'Обед', icon: '☀️' },
  snack: { label: 'Полдник', icon: '🍵' },
  dinner: { label: 'Ужин', icon: '🌙' },
};

const MEMBER_SHORT: Record<string, string> = {
  kolya: 'К',
  kristina: 'Кр',
  both: 'Оба',
};


export function MealSlot({ slot, onUpdate, isExpanded = true, onToggle }: MealSlotProps) {
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

  // Estimate total reheat/cook time from recipes
  const estimatedTime = recipes.reduce((sum, r) => {
    const reheat = r.reheating?.[0]?.duration;
    return sum + (reheat ?? Math.min(r.totalTime, 15));
  }, 0);

  // Collapsed header row
  const headerRow = (
    <button
      onClick={onToggle}
      className={`w-full flex items-center py-3 px-3 transition-all ${
        onToggle ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{ gap: '10px', minHeight: '44px' }}
      type="button"
    >
      <span className="text-base">{meal.icon}</span>
      <span className="flex-1 text-left font-heading font-bold text-sm text-text-primary">
        {meal.label}
      </span>
      {!isExpanded && recipes.length > 0 && (
        <span className="text-[11px] font-mono text-text-muted">
          {estimatedTime > 0 && `~${estimatedTime} мин`}
        </span>
      )}
      {!isExpanded && recipes.length > 0 && (
        <span className="text-[11px] font-mono text-text-muted">
          {recipes.length} бл.
        </span>
      )}
      {hasMissingIngredients && !isExpanded && (
        <AlertTriangle className="w-3.5 h-3.5 text-ramen flex-shrink-0" />
      )}
      {onToggle && (
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  );

  // Expanded content
  const expandedContent = (
    <div
      className="px-3 pb-3 animate-slide-down"
    >
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
            const forWhomSet = new Set([entry?.forWhom].filter(Boolean));
            const borderClass =
              forWhomSet.has('kolya') ? 'border-l-[3px] border-l-kolya/60'
              : forWhomSet.has('kristina') ? 'border-l-[3px] border-l-kristina/60'
              : forWhomSet.has('both') ? 'border-l-[3px] border-l-portal/60'
              : '';

            return (
              <div
                key={`${recipe.id}-${index}`}
                className={`flex items-center py-1.5 pl-3 ${borderClass}`}
                style={{ gap: '8px' }}
              >
                <div className="flex-1 min-w-0">
                  {isCoffeeOnly ? (
                    <span className="text-sm font-body text-text-dim flex items-center" style={{ gap: '4px' }}>
                      <Coffee className="w-3.5 h-3.5" /> Только кофе
                    </span>
                  ) : (
                    <div>
                      <Link
                        to={`/recipe/${recipe.id}`}
                        onClick={() => console.log(`[MealSlot] Navigate to recipe: ${recipe.title}`)}
                        className="text-sm font-heading font-medium text-text-primary hover:text-portal transition-colors"
                      >
                        {recipe.title}
                      </Link>
                      {entry?.variation && (
                        <span className="text-[11px] text-text-muted font-body ml-1">
                          {entry.variation}
                        </span>
                      )}
                      {/* Subtitle row: ingredients hint */}
                      {recipe.subtitle && (
                        <div className="text-[11px] text-text-muted font-body">{recipe.subtitle}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Frozen badge */}
                {isFrozen && (
                  <span title="Из морозилки"><Snowflake className="w-3.5 h-3.5 text-frost flex-shrink-0" /></span>
                )}

                {/* Reheating hint */}
                {isFrozen && recipe.reheating && entry?.forWhom && (
                  (() => {
                    const rh = recipe.reheating.find(r => r.forWhom === entry.forWhom || r.forWhom === 'both');
                    return rh ? (
                      <span className="text-[10px] font-mono text-frost flex-shrink-0">{rh.method}</span>
                    ) : null;
                  })()
                )}

                {/* Member badge (compact) */}
                {entry?.forWhom && (
                  <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 font-heading font-semibold border rounded-pill ${
                    entry.forWhom === 'kolya'
                      ? 'bg-kolya/8 text-kolya border-kolya/20'
                      : entry.forWhom === 'kristina'
                      ? 'bg-kristina/8 text-kristina border-kristina/20'
                      : 'bg-portal/8 text-portal border-portal/20'
                  }`}>
                    {MEMBER_SHORT[entry.forWhom]}
                  </span>
                )}

                {/* Packable icon */}
                {slot.mealType === 'lunch' && recipe.tags?.includes('packable') && (
                  <span className="text-[10px] text-miso flex-shrink-0" title="Можно взять с собой">🥡</span>
                )}

                {/* Swap button — 28x28 min */}
                {onUpdate && (
                  <button
                    onClick={() => handleSwapRecipe(index)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md border border-elevated bg-void text-text-muted hover:text-portal hover:border-portal/30 transition-colors"
                    title="Заменить блюдо"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
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

      {hasMissingIngredients && isExpanded && (
        <div className="flex items-center text-ramen mt-2" style={{ gap: '4px' }}>
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-body">Не хватает ингредиентов</span>
        </div>
      )}

      {!showIngredientCheck && isExpanded && (
        <button
          onClick={() => { console.log(`[MealSlot:${slot.mealType}] Opening ingredient check`); setShowIngredientCheck(true); }}
          className="w-full mt-3 bg-rift border border-nebula text-text-secondary font-heading font-semibold text-xs py-2 px-3 rounded-button hover:bg-nebula hover:border-portal/30 transition-colors"
        >
          Проверить ингредиенты
        </button>
      )}

      {showIngredientCheck && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-semibold text-text-muted">Ингредиенты для {meal.label.toLowerCase()}а</span>
            <button
              onClick={() => { console.log(`[MealSlot:${slot.mealType}] Closing ingredient check`); setShowIngredientCheck(false); }}
              className="flex items-center px-2 py-1 text-xs font-heading font-semibold text-text-secondary bg-rift border border-nebula rounded-button hover:bg-nebula hover:text-ramen hover:border-ramen/30 transition-colors"
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

  return (
    <div className="border-b border-nebula last:border-b-0">
      {headerRow}
      {isExpanded && expandedContent}
    </div>
  );
}

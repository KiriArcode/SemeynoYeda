import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import type { MealSlot as MealSlotType, Recipe } from '../../data/schema';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { IngredientCheck } from '../cooking/IngredientCheck';
import { AlertTriangle, X, Snowflake, ArrowLeftRight, Coffee, ChevronDown } from 'lucide-react';

interface MealSlotProps {
  slot: MealSlotType;
  date: string;
  onUpdate?: (updatedSlot: MealSlotType) => void;
  /** Called when user clicks swap — parent opens modal and applies change */
  onRequestSwap?: (recipeIndexInSlot: number) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const MEAL_LABELS: Record<string, { label: string; icon: string }> = {
  breakfast: { label: 'Завтрак', icon: '🌅' },
  second_breakfast: { label: 'Второй завтрак', icon: '🍎' },
  lunch: { label: 'Обед', icon: '☀️' },
  snack: { label: 'Полдник', icon: '🍵' },
  dinner: { label: 'Ужин', icon: '🌙' },
  late_snack: { label: 'Второй ужин', icon: '🥛' },
};

const MEMBER_SHORT: Record<string, string> = {
  kolya: 'К',
  kristina: 'Кр',
  both: 'Оба',
};

/** Explicit badge styles to avoid Tailwind opacity syntax issues */
const MEMBER_BADGE_STYLES: Record<string, React.CSSProperties> = {
  kolya: { background: 'rgba(0,229,255,0.10)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.25)' },
  kristina: { background: 'rgba(255,107,157,0.10)', color: '#FF6B9D', borderColor: 'rgba(255,107,157,0.25)' },
  both: { background: 'rgba(57,255,20,0.10)', color: '#39FF14', borderColor: 'rgba(57,255,20,0.25)' },
};


export function MealSlot({ slot, onUpdate, onRequestSwap, isExpanded = true, onToggle }: MealSlotProps) {
  const [showIngredientCheck, setShowIngredientCheck] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const { getMissingIngredients } = useIngredientAvailability();
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);

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
    logger.log(`[MealSlot:${slot.mealType}] Loading ${recipeIds.length} recipes...`);
    (async () => {
      try {
        const allRecipes = await dataService.recipes.list();
        const validRecipes = recipeIds
          .map((id) => allRecipes.find((r) => r.id === id))
          .filter((r): r is Recipe => r != null);
        if (!cancelled) {
          setRecipes(validRecipes);
          logger.log(`[MealSlot:${slot.mealType}] Loaded ${validRecipes.length}/${recipeIds.length} recipes`);
        }
        const missing = await getMissingIngredients(recipeIds);
        if (!cancelled) {
          setMissingIngredients(missing);
        }
      } catch (error) {
        if (!cancelled) {
          setRecipes([]);
          setRecipesError(error instanceof Error ? error.message : 'Ошибка загрузки рецептов');
          logger.error(`[MealSlot:${slot.mealType}] Failed to load recipes`, { recipeIds, error });
        }
      } finally {
        if (!cancelled) {
          setRecipesLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(recipeIds)]);

  function handleSwapRecipe(e: React.MouseEvent, index: number) {
    e.stopPropagation();
    e.preventDefault();
    logger.log(`[MealSlot:${slot.mealType}] Requesting swap for index ${index}`);
    onRequestSwap?.(index);
  }

  function handleIngredientCheckComplete(missing: string[]) {
    logger.log(`[MealSlot:${slot.mealType}] Ingredient check complete, missing: ${missing.length}`);
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

  // Border color per family member
  const BORDER_COLORS: Record<string, string> = {
    kolya: '#00E5FF',
    kristina: '#FF6B9D',
    both: '#39FF14',
  };

  return (
    <div className="border-b border-nebula last:border-b-0">
      {/* Header row — clickable to toggle accordion; explicit colors for visibility */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 min-h-[44px] text-text-light py-3 px-3 transition-all ${
          onToggle ? 'cursor-pointer' : 'cursor-default'
        }`}
        type="button"
      >
        <span className="text-base">{meal.icon}</span>
        <span className="flex-1 text-left font-heading font-bold text-sm text-text-light">
          {meal.label}
        </span>
        {!isExpanded && recipes.length > 0 && (
          <span className="text-[11px] font-mono text-text-dim">
            {estimatedTime > 0 ? `разогрев ${estimatedTime} мин` : `${recipes.length} бл.`}
          </span>
        )}
        {hasMissingIngredients && !isExpanded && (
          <AlertTriangle className="w-3.5 h-3.5 text-ramen flex-shrink-0" />
        )}
        {onToggle && (
          <ChevronDown
            className={`w-4 h-4 text-text-dim transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 animate-slide-down">
          {recipesLoading && recipeIds.length > 0 && (
            <p className="text-sm font-body text-text-muted">Загрузка рецептов...</p>
          )}
          {recipesError && (
            <p className="text-xs font-body text-ramen">{recipesError}</p>
          )}
          {!recipesLoading && recipes.length > 0 && (
            <div className="space-y-1">
              {recipes.map((recipe, index) => {
                const entry = slot.recipes[index];
                const isFrozen = entry?.usesFromFreezer && entry.usesFromFreezer.length > 0;
                const isCoffeeOnly = entry?.coffeeOnly;
                const borderColor = entry?.forWhom ? BORDER_COLORS[entry.forWhom] : undefined;

                return (
                  <div
                    key={`${recipe.id}-${index}`}
                    className="flex items-center gap-2 py-2 pl-3 pr-1"
                    style={{
                      borderLeft: borderColor ? `3px solid ${borderColor}` : undefined,
                      borderLeftColor: borderColor ? `color-mix(in srgb, ${borderColor} 60%, transparent)` : undefined,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      {isCoffeeOnly ? (
                        <span className="text-sm font-body text-text-muted flex items-center gap-1">
                          <Coffee className="w-3.5 h-3.5" /> Только кофе
                        </span>
                      ) : (
                        <div>
                          <Link
                            to={`/recipe/${recipe.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-heading font-medium text-text-primary hover:text-portal transition-colors"
                          >
                            {recipe.title}
                          </Link>
                          {entry?.variation && (
                            <span className="text-[11px] text-text-muted font-body ml-1">
                              {entry.variation}
                            </span>
                          )}
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

                    {/* Member badge — explicit inline styles to avoid Tailwind opacity issues */}
                    {entry?.forWhom && (
                      <span
                        className="flex-shrink-0 text-[10px] px-2 py-0.5 font-heading font-semibold border rounded-full"
                        style={MEMBER_BADGE_STYLES[entry.forWhom]}
                      >
                        {MEMBER_SHORT[entry.forWhom]}
                      </span>
                    )}

                    {/* Packable icon */}
                    {slot.mealType === 'lunch' && recipe.tags?.includes('packable') && (
                      <span className="text-[10px] text-miso flex-shrink-0" title="Можно взять с собой">🥡</span>
                    )}

                    {/* Swap button — opens modal at page level via onRequestSwap */}
                    {onRequestSwap && (
                      <button
                        onClick={(e) => handleSwapRecipe(e, index)}
                        className="flex-shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] w-7 h-7 rounded-[8px] border border-nebula bg-void text-text-muted hover:border-portal/30 hover:text-portal transition-colors"
                        title="Заменить блюдо"
                        aria-label="Заменить блюдо"
                        type="button"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {slot.recipes.length > recipes.length && (
                <p className="text-xs font-body text-text-muted">Рецепт не найден</p>
              )}
            </div>
          )}

          {hasMissingIngredients && (
            <div className="flex items-center gap-1 text-ramen mt-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-body">Не хватает ингредиентов</span>
            </div>
          )}

          {!showIngredientCheck && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                logger.log('[MealSlot] Ingredient check button clicked', { mealType: slot.mealType });
                setShowIngredientCheck(true);
              }}
              className="w-full mt-3 text-text-secondary font-heading font-semibold text-xs py-2 px-3 bg-[#1C2230] border border-nebula rounded-button transition-colors"
              type="button"
            >
              Проверить ингредиенты
            </button>
          )}

          {showIngredientCheck && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-heading font-semibold text-text-muted">Ингредиенты для {meal.label.toLowerCase()}а</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowIngredientCheck(false); }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-heading font-semibold text-text-secondary bg-[#1C2230] border border-nebula rounded-button transition-colors"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" /> Закрыть
                </button>
              </div>
              <IngredientCheck recipeIds={recipeIds} onComplete={handleIngredientCheckComplete} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

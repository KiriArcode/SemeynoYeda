import { useState, useEffect } from 'react';
import { dataService } from '../../lib/dataService';
import type { Recipe, MealType, Ingredient } from '../../data/schema';
import { useCookingTimers } from '../../hooks/useCookingTimers';
import { IngredientCheck } from './IngredientCheck';
import { ParallelCooking } from './ParallelCooking';
import { CheckCircle2, ChefHat } from 'lucide-react';

interface CookingSessionProps {
  recipeIds: string[];
  mealType?: MealType;
  portionsPerRecipe?: Record<string, number>;
  onComplete?: () => void;
}

export function CookingSession({ recipeIds, portionsPerRecipe = {}, onComplete }: CookingSessionProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [step, setStep] = useState<'check' | 'cooking' | 'complete'>('check');
  const { startTimer } = useCookingTimers();

  useEffect(() => {
    loadRecipes();
  }, [recipeIds]);

  async function loadRecipes() {
    try {
      const allRecipes = await dataService.recipes.list();
      const validRecipes = recipeIds
        .map((id) => allRecipes.find((r) => r.id === id))
        .filter((r): r is Recipe => r != null);
      setRecipes(validRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  }

  function handleIngredientsChecked() {
    setStep('cooking');
    startParallelTimers();
  }

  async function startParallelTimers() {
    for (const recipe of recipes) {
      // Найти параллельные шаги
      const parallelSteps = recipe.steps.filter((step) => step.parallel && step.duration);
      
      for (const step of parallelSteps) {
        if (step.duration) {
          await startTimer(
            recipe.id,
            step.order,
            `${recipe.title}: ${step.text}`,
            step.duration * 60
          );
        }
      }
    }
  }

  function handleComplete() {
    setStep('complete');
    if (onComplete) {
      onComplete();
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <ChefHat className="w-6 h-6 text-portal" />
          <h2 className="font-heading text-2xl font-bold text-text-light">
            Сессия готовки
          </h2>
        </div>

        <div className="space-y-2">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="flex items-center gap-2 text-text-mid font-body">
              <CheckCircle2 className="w-4 h-4 text-portal" />
              <span>{recipe.title}</span>
              <span className="text-xs text-text-dim font-mono">
                {recipe.totalTime} мин
              </span>
            </div>
          ))}
        </div>
      </div>

      {step === 'check' && (
        <div>
          <IngredientCheck
            recipeIds={recipeIds}
            portionsPerRecipe={portionsPerRecipe}
            onComplete={handleIngredientsChecked}
          />
        </div>
      )}

      {step === 'cooking' && (
        <div className="space-y-6">
          <ParallelCooking />

          {recipes.some((r) => portionsPerRecipe[r.id]) && (
            <div className="bg-portal-soft border border-portal/30 rounded-card p-4">
              <h4 className="text-xs font-mono text-portal-dim tracking-widest mb-2">НА ЭТИ ПОРЦИИ (вес)</h4>
              <p className="text-xs text-text-muted font-body mb-2">
                Готовить ровно столько — не на потом
              </p>
              <ul className="space-y-1 text-sm font-body text-text-light">
                {recipes
                  .filter((r) => portionsPerRecipe[r.id] && r.servings > 0)
                  .flatMap((r) => {
                    const portions = portionsPerRecipe[r.id];
                    const factor = portions / r.servings;
                    return r.ingredients
                      .filter((ing) => ing.unit === 'г' || ing.unit === 'мл' || ing.unit === 'кг' || ing.unit === 'л')
                      .map((ing: Ingredient) => ({
                        ...ing,
                        scaled: Math.round(ing.amount * factor),
                        recipeTitle: r.title,
                      }));
                  })
                  .map((item, i) => (
                    <li key={i}>
                      {item.scaled} {item.unit} {item.name}
                      <span className="text-text-muted ml-1">· {item.recipeTitle}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="bg-dimension border border-nebula rounded-card p-5">
            <h3 className="font-heading text-lg font-bold text-text-light mb-4">
              Инструкции по готовке
            </h3>

            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="border-b border-nebula pb-4 last:border-0">
                  <h4 className="font-heading font-semibold text-text-light mb-2">
                    {recipe.title}
                  </h4>
                  <ol className="space-y-2">
                    {recipe.steps.map((step) => (
                      <li key={step.order} className="flex gap-3 text-sm font-body text-text-mid">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rift border border-nebula flex items-center justify-center text-xs font-heading font-semibold text-portal">
                          {step.order}
                        </span>
                        <div className="flex-1">
                          <p>{step.text}</p>
                          {step.equipment && (
                            <p className="text-xs text-text-dim mt-1">
                              {step.equipment.label}
                              {step.equipment.settings && ` · ${step.equipment.settings}`}
                            </p>
                          )}
                          {step.duration && (
                            <p className="text-xs font-mono text-portal mt-1">
                              ⏱ {step.duration} мин
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="mt-6 w-full bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold py-3 px-4 rounded-button shadow-glow hover:shadow-glow/80 transition-shadow"
            >
              Завершить готовку
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="bg-dimension border border-portal rounded-card p-5 shadow-glow">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-portal" />
            <h3 className="font-heading text-xl font-bold text-portal">
              Готовка завершена!
            </h3>
          </div>
          <p className="text-text-mid font-body">
            Все блюда готовы. Приятного аппетита!
          </p>
        </div>
      )}
    </div>
  );
}

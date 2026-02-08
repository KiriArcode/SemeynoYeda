import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Recipe, WeekMenu, MealType } from '../data/schema';
import { CookingSession } from '../components/cooking/CookingSession';
import { ParallelCooking } from '../components/cooking/ParallelCooking';
import { ChefHat } from 'lucide-react';

export default function CookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [kolyaMealsMode, setKolyaMealsMode] = useState<'4' | '5-6'>('4');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [portionsPerRecipe, setPortionsPerRecipe] = useState<Record<string, number>>({});
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    loadWeekMenu();
    loadChefSettings();
  }, []);

  async function loadChefSettings() {
    try {
      const s = await db.table('chefSettings').get('default');
      if (s?.kolyaMealsMode === '5-6') setKolyaMealsMode('5-6');
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (selectedDate && selectedMealType && weekMenu) {
      loadRecipesForMeal();
    }
  }, [selectedDate, selectedMealType, weekMenu]);

  async function loadWeekMenu() {
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      if (menu) {
        setWeekMenu(menu);
      }
    } catch (error) {
      console.error('Failed to load week menu:', error);
    }
  }

  async function loadRecipesForMeal() {
    if (!weekMenu) return;

    const day = weekMenu.days.find((d) => d.date === selectedDate);
    if (!day) return;

    const meal = day.meals.find((m) => m.mealType === selectedMealType);
    if (!meal) return;

    const recipeIds = [...new Set(meal.recipes.map((r) => r.recipeId))];
    const portions: Record<string, number> = {};
    for (const entry of meal.recipes) {
      portions[entry.recipeId] = (portions[entry.recipeId] || 0) + 1;
    }
    setPortionsPerRecipe(portions);
    const loadedRecipes = await db.table('recipes').bulkGet(recipeIds);
    const validRecipes = loadedRecipes.filter((r): r is Recipe => r !== undefined);
    setRecipes(validRecipes);
  }

  function handleStartSession() {
    if (recipes.length > 0) {
      setSessionStarted(true);
    }
  }

  function handleCompleteSession() {
    setSessionStarted(false);
    setSelectedMealType(null);
  }

  const baseMealTypes = [
    { value: 'breakfast' as const, label: 'Завтрак', icon: '🌅' },
    { value: 'lunch' as const, label: 'Обед', icon: '🍽️' },
    { value: 'snack' as const, label: 'Полдник', icon: '🍎' },
    { value: 'dinner' as const, label: 'Ужин', icon: '🌙' },
  ];
  const mealTypes = kolyaMealsMode === '5-6'
    ? [
        { value: 'breakfast' as const, label: 'Завтрак', icon: '🌅' },
        { value: 'second_breakfast' as const, label: 'Второй завтрак', icon: '🍎' },
        { value: 'lunch' as const, label: 'Обед', icon: '🍽️' },
        { value: 'snack' as const, label: 'Полдник', icon: '🍎' },
        { value: 'dinner' as const, label: 'Ужин', icon: '🌙' },
        { value: 'late_snack' as const, label: 'Второй ужин', icon: '🥛' },
      ]
    : baseMealTypes;

  if (sessionStarted && recipes.length > 0) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <CookingSession
          recipeIds={recipes.map((r) => r.id)}
          mealType={selectedMealType || 'dinner'}
          portionsPerRecipe={portionsPerRecipe}
          onComplete={handleCompleteSession}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <ChefHat className="w-6 h-6 text-portal" />
          <h1 className="font-heading text-2xl font-bold text-text-light">
            Параллельная готовка
          </h1>
        </div>
        <p className="text-text-mid font-body">
          Выберите день и приём пищи для начала готовки
        </p>
      </div>

      {/* Выбор даты */}
      <div className="bg-dimension border border-nebula rounded-card p-5 mb-4 shadow-card">
        <label className="block text-sm font-heading font-semibold text-text-light mb-2">
          Дата
        </label>
        <input
          id="cooking-date"
          name="cooking-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
        />
      </div>

      {/* Выбор приёма пищи */}
      <div className="bg-dimension border border-nebula rounded-card p-5 mb-4 shadow-card">
        <label className="block text-sm font-heading font-semibold text-text-light mb-3">
          Приём пищи
        </label>
        <div className="grid grid-cols-2 gap-3">
          {mealTypes.map((meal) => (
            <button
              key={meal.value}
              onClick={() => setSelectedMealType(meal.value)}
              className={`p-4 border rounded-card transition-all ${
                selectedMealType === meal.value
                  ? 'border-portal bg-portal-mist shadow-glow'
                  : 'border-nebula bg-rift hover:border-portal/30'
              }`}
            >
              <div className="text-2xl mb-1">{meal.icon}</div>
              <div className={`text-sm font-heading font-semibold ${
                selectedMealType === meal.value ? 'text-portal' : 'text-text-mid'
              }`}>
                {meal.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Выбранные рецепты */}
      {recipes.length > 0 && (
        <div className="bg-dimension border border-nebula rounded-card p-5 mb-4 shadow-card">
          <h3 className="font-heading font-semibold text-text-light mb-3">
            Рецепты для готовки
          </h3>
          <div className="space-y-2 mb-4">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between p-2 bg-rift rounded-button">
                <div>
                  <span className="text-sm font-body text-text-light">{recipe.title}</span>
                  {portionsPerRecipe[recipe.id] != null && (
                    <span className="ml-2 text-xs font-mono text-portal">
                      · {portionsPerRecipe[recipe.id]} порц.
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-text-dim">{recipe.totalTime} мин</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleStartSession}
            className="w-full bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold py-3 px-4 rounded-button shadow-glow hover:shadow-glow/80 transition-shadow"
          >
            Начать готовку
          </button>
        </div>
      )}

      {/* Активные таймеры */}
      <div className="mt-6">
        <ParallelCooking />
      </div>
    </div>
  );
}

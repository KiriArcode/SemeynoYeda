import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Recipe, WeekMenu } from '../data/schema';
import { PrepBlock } from '../components/prep/PrepBlock';
import { Calendar } from 'lucide-react';

export default function PrepPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekMenu();
  }, []);

  useEffect(() => {
    if (selectedDate && weekMenu) {
      loadRecipesForDate();
    }
  }, [selectedDate, weekMenu]);

  async function loadWeekMenu() {
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      if (menu) {
        setWeekMenu(menu);
      }
    } catch (error) {
      console.error('Failed to load week menu:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecipesForDate() {
    if (!weekMenu) return;

    const day = weekMenu.days.find((d) => d.date === selectedDate);
    if (!day) {
      setRecipes([]);
      return;
    }

    // Собрать все рецепты из всех приёмов пищи за день
    const recipeIds = new Set<string>();
    day.meals.forEach((meal) => {
      meal.recipes.forEach((recipe) => {
        recipeIds.add(recipe.recipeId);
      });
    });

    const loadedRecipes = await db.table('recipes').bulkGet(Array.from(recipeIds));
    const validRecipes = loadedRecipes.filter((r): r is Recipe => r !== undefined);
    setRecipes(validRecipes);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-light mb-2">
          Подготовка к готовке
        </h1>
        <p className="text-text-mid font-body">
          Выберите день для генерации плана подготовки ингредиентов
        </p>
      </div>

      {/* Выбор даты */}
      <div className="bg-dimension border border-nebula rounded-card p-5 mb-6 shadow-card">
        <label className="block text-sm font-heading font-semibold text-text-light mb-2">
          Дата
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-dim" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-rift border border-nebula rounded-button px-4 py-2 pl-10 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
          />
        </div>
      </div>

      {/* Блок подготовки */}
      {recipes.length > 0 ? (
        <PrepBlock recipes={recipes} date={selectedDate} />
      ) : (
        <div className="bg-dimension border border-nebula rounded-card p-5">
          <p className="text-text-mid font-body">
            Нет рецептов для выбранной даты. Вселенная голодна 🌀 Запланируем неделю?
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Recipe } from '../data/schema';
import { Search } from 'lucide-react';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, selectedCategory]);

  async function loadRecipes() {
    try {
      // Убеждаемся, что база инициализирована
      const { initializeDatabase } = await import('../lib/initDb');
      await initializeDatabase();
      
      const allRecipes = await db.table('recipes').toArray();
      setRecipes(allRecipes);
      setFilteredRecipes(allRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterRecipes() {
    let filtered = recipes;

    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    setFilteredRecipes(filtered);
  }

  const categories = [
    { value: 'all', label: 'Все' },
    { value: 'main', label: 'Основные' },
    { value: 'sauce', label: 'Соусы' },
    { value: 'side', label: 'Гарниры' },
    { value: 'breakfast', label: 'Завтраки' },
    { value: 'snack', label: 'Полдники' },
    { value: 'soup', label: 'Супы' },
    { value: 'dessert', label: 'Десерты' },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка рецептов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <h1 className="font-heading text-2xl font-bold text-text-light mb-6">
        Рецепты
      </h1>

      {/* Поиск */}
      <div className="bg-dimension border border-nebula rounded-card p-4 mb-4 shadow-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-dim" />
          <input
            id="recipe-search"
            name="recipe-search"
            type="text"
            placeholder="Поиск рецептов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-rift border border-nebula rounded-button px-4 py-2 pl-10 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
          />
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-button font-heading font-semibold text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow'
                  : 'bg-rift border border-nebula text-text-mid hover:border-portal/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список рецептов */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-dimension border border-nebula rounded-card p-5 text-center">
          <p className="text-text-mid font-body">
            Рецепты не найдены
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-dimension border border-nebula rounded-card p-4 shadow-card hover:border-portal/30 hover:shadow-glow transition-all cursor-pointer"
            >
              <h3 className="font-heading font-semibold text-text-light mb-2">
                {recipe.title}
              </h3>
              {recipe.subtitle && (
                <p className="text-sm text-text-dim font-body mb-2">{recipe.subtitle}</p>
              )}
              <div className="flex items-center gap-2 text-xs font-mono text-portal">
                <span>⏱ {recipe.totalTime} мин</span>
                <span className="text-text-dim">·</span>
                <span>{recipe.servings} порций</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

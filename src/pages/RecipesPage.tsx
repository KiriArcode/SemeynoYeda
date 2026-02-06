import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { Recipe } from '../data/schema';
import { Search } from 'lucide-react';

export default function RecipesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  console.log('[DEBUG] RecipesPage rendering:', { recipesCount: recipes.length, filteredCount: filteredRecipes.length, loading, navigateType: typeof navigate });

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RecipesPage.tsx:component-mount',
        message: 'RecipesPage mounted',
        data: { recipesCount: recipes.length, filteredCount: filteredRecipes.length, loading },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
  }, []);
  // #endregion

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, selectedCategory]);

  async function loadRecipes() {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'RecipesPage.tsx:loadRecipes-entry',
        message: 'loadRecipes called',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C'
      })
    }).catch(() => {});
    // #endregion
    try {
      // Убеждаемся, что база инициализирована
      const { initializeDatabase } = await import('../lib/initDb');
      await initializeDatabase();
      
      const allRecipes = await db.table('recipes').toArray();
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'RecipesPage.tsx:loadRecipes-after-db',
          message: 'Recipes loaded from DB',
          data: { count: allRecipes.length, ids: allRecipes.map(r => r.id) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        })
      }).catch(() => {});
      // #endregion
      setRecipes(allRecipes);
      setFilteredRecipes(allRecipes);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'RecipesPage.tsx:loadRecipes-error',
          message: 'Error loading recipes',
          data: { error: String(error) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        })
      }).catch(() => {});
      // #endregion
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
          {filteredRecipes.map((recipe) => {
            const targetPath = `/recipe/${recipe.id}`;
            return (
              <Link
                key={recipe.id}
                to={targetPath}
                onClick={() => {
                  console.log('[DEBUG] Recipe card Link clicked:', { 
                    recipeId: recipe.id, 
                    targetPath, 
                    currentPath: location.pathname,
                    windowPath: window.location.pathname
                  });
                  // #region agent log
                  fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: 'RecipesPage.tsx:recipe-card-click',
                      message: 'Recipe card clicked',
                      data: { recipeId: recipe.id, recipeTitle: recipe.title, targetPath, currentPath: location.pathname },
                      timestamp: Date.now(),
                      sessionId: 'debug-session',
                      runId: 'run1',
                      hypothesisId: 'A'
                    })
                  }).catch(() => {});
                  // #endregion
                }}
                className="bg-dimension border border-nebula rounded-card p-4 shadow-card hover:border-portal/30 hover:shadow-glow transition-all cursor-pointer block"
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

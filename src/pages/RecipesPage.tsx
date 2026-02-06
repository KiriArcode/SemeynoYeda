import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { Recipe, DietTag, FamilyMember } from '../data/schema';
import { Search } from 'lucide-react';

const TAG_LABELS: Record<DietTag, string> = {
  'gastritis-safe': 'Щадящее',
  'soft-texture': 'Мягкая текстура',
  'rich-feel': 'Сытное',
  'freezable': 'Можно заморозить',
  'quick': 'Быстро',
  'prep-day': 'Заготовка',
};

const MEMBER_LABELS: Record<FamilyMember, string> = {
  kolya: 'Коля',
  kristina: 'Кристина',
  both: 'Оба',
};

export default function RecipesPage() {
  const location = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Извлечение тега из query параметров
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tag = searchParams.get('tag');
    setSelectedTag(tag);
  }, [location.search]);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, selectedCategory, selectedTag]);

  async function loadRecipes() {
    try {
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

    // Фильтр по тегу из query параметра (например, ?tag=prep-day)
    if (selectedTag) {
      const validTags: DietTag[] = ['gastritis-safe', 'soft-texture', 'rich-feel', 'freezable', 'quick', 'prep-day'];
      if (validTags.includes(selectedTag as DietTag)) {
        filtered = filtered.filter((recipe) => recipe.tags.includes(selectedTag as DietTag));
      }
    }

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

  const pageTitle = selectedTag === 'prep-day' ? 'Заготовки' : 'Рецепты';

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <h1 className="font-heading text-2xl font-bold text-text-light mb-6">
        {pageTitle}
      </h1>
      {selectedTag === 'prep-day' && (
        <p className="text-text-mid font-body mb-4">
          Рецепты для заготовок выходного дня
        </p>
      )}

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
                className="bg-dimension border border-nebula rounded-card p-4 shadow-card hover:border-portal/30 hover:shadow-glow transition-all cursor-pointer block card-hover"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading font-semibold text-text-light">
                    {recipe.title}
                  </h3>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-pill font-heading font-semibold ${
                    recipe.suitableFor === 'kolya'
                      ? 'bg-portal/20 text-portal'
                      : recipe.suitableFor === 'kristina'
                      ? 'bg-ramen/20 text-ramen'
                      : 'bg-plasma/20 text-plasma'
                  }`}>
                    {MEMBER_LABELS[recipe.suitableFor]}
                  </span>
                </div>
                {recipe.subtitle && (
                  <p className="text-sm text-text-dim font-body mb-2">{recipe.subtitle}</p>
                )}
                <div className="flex items-center gap-2 text-xs font-mono text-portal mb-2">
                  <span>⏱ {recipe.totalTime} мин</span>
                  <span className="text-text-dim">·</span>
                  <span>{recipe.servings} порций</span>
                </div>
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-1.5 py-0.5 rounded-pill font-heading ${
                          tag === 'gastritis-safe' ? 'bg-matcha/20 text-matcha'
                          : tag === 'freezable' ? 'bg-frost/20 text-frost'
                          : tag === 'quick' ? 'bg-ramen/20 text-ramen'
                          : tag === 'prep-day' ? 'bg-plasma/20 text-plasma'
                          : 'bg-nebula text-text-dim'
                        }`}
                      >
                        {TAG_LABELS[tag]}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

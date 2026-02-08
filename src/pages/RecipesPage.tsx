import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { Recipe, DietTag, FamilyMember } from '../data/schema';
import { Search, Plus, Briefcase, Zap } from 'lucide-react';

const TAG_LABELS: Record<DietTag, string> = {
  'gastritis-safe': 'Щадящее',
  'soft-texture': 'Мягкая текстура',
  'rich-feel': 'Сытное',
  'freezable': 'Можно заморозить',
  'quick': 'Быстро',
  'prep-day': 'Заготовка',
  'batch-cooking': 'Массовая готовка',
  'overnight': 'С вечера',
  'packable': 'С собой',
  'low-calorie': 'Низкокалорийное',
  'blanch-before-freeze': 'Бланширование перед заморозкой',
};

const MEMBER_LABELS: Record<FamilyMember, string> = {
  kolya: 'Коля',
  kristina: 'Кристина',
  both: 'Оба',
};

const MEMBER_BADGE: Record<string, React.CSSProperties> = {
  kolya: { background: 'rgba(0,229,255,0.10)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.25)' },
  kristina: { background: 'rgba(255,107,157,0.10)', color: '#FF6B9D', borderColor: 'rgba(255,107,157,0.25)' },
  both: { background: 'rgba(57,255,20,0.10)', color: '#39FF14', borderColor: 'rgba(57,255,20,0.25)' },
};

function getTagStyle(tag: DietTag): string {
  switch (tag) {
    case 'gastritis-safe': return 'bg-[#0D2818] text-portal border-[#1A4030]';
    case 'freezable': return 'bg-[#0D1B28] text-frost border-[#1A3040]';
    case 'quick': return 'bg-[#281A0D] text-accent-orange border-[#403020]';
    case 'prep-day': return 'bg-[#1A0D28] text-plasma border-[#2D1A40]';
    case 'batch-cooking': return 'bg-[#1A1A28] text-plasma border-[#2D2D40]';
    case 'overnight': return 'bg-[#1A0D28] text-plasma border-[#2D1A40]';
    case 'packable': return 'bg-[#281A0D] text-accent-orange border-[#403020]';
    case 'rich-feel': return 'bg-[#280D1A] text-kristina border-[#401A2D]';
    case 'low-calorie': return 'bg-[#0D2818] text-portal border-[#1A4030]';
    case 'blanch-before-freeze': return 'bg-[#0D1B28] text-frost border-[#1A3040]';
    default: return 'bg-nebula text-text-dim border-text-ghost';
  }
}

export default function RecipesPage() {
  const location = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [personFilter, setPersonFilter] = useState<FamilyMember | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<'none' | 'quick-breakfast' | 'packable'>('none');
  const [loading, setLoading] = useState(true);

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
  }, [recipes, searchQuery, selectedCategory, selectedTag, personFilter, quickFilter]);

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

    // Tag filter from URL
    if (selectedTag) {
      const validTags: DietTag[] = ['gastritis-safe', 'soft-texture', 'rich-feel', 'freezable', 'quick', 'prep-day', 'batch-cooking', 'overnight', 'packable', 'low-calorie', 'blanch-before-freeze'];
      if (validTags.includes(selectedTag as DietTag)) {
        filtered = filtered.filter((recipe) => recipe.tags.includes(selectedTag as DietTag));
      }
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    // Person filter ("Мои блюда")
    if (personFilter !== 'all') {
      filtered = filtered.filter(r => r.suitableFor === personFilter || r.suitableFor === 'both');
    }

    // Quick filters
    if (quickFilter === 'quick-breakfast') {
      filtered = filtered.filter(r => r.category === 'breakfast' && r.totalTime <= 5);
    } else if (quickFilter === 'packable') {
      filtered = filtered.filter(r => r.tags.includes('packable'));
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-light">
          {pageTitle}
        </h1>
        <Link to="/recipe/new"
          className="flex items-center px-4 py-2 text-sm font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors"
          style={{ gap: '6px' }}>
          <Plus className="w-4 h-4" /> Новый
        </Link>
      </div>

      {selectedTag === 'prep-day' && (
        <p className="text-text-mid font-body mb-4">Рецепты для заготовок выходного дня</p>
      )}

      {/* Search */}
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

      {/* Person filter */}
      <div className="flex flex-wrap mb-3" style={{ gap: '6px' }}>
        {([['all', 'Все'] as const, ['kolya', 'Коля'] as const, ['kristina', 'Кристина'] as const]).map(([val, label]) => (
          <button key={val} onClick={() => setPersonFilter(val)}
            className={`px-3 py-1.5 text-xs font-heading font-semibold border transition-colors ${
              personFilter === val
                ? 'bg-portal/20 text-portal border-portal/50'
                : 'bg-rift text-text-dim border-nebula hover:border-portal/30'
            }`} style={{ borderRadius: '9999px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap mb-4" style={{ gap: '6px' }}>
        <button onClick={() => setQuickFilter(quickFilter === 'quick-breakfast' ? 'none' : 'quick-breakfast')}
          className={`flex items-center px-3 py-1.5 text-xs font-heading font-semibold border transition-colors ${
            quickFilter === 'quick-breakfast'
              ? 'bg-miso/20 text-miso border-miso/50'
              : 'bg-rift text-text-dim border-nebula hover:border-miso/30'
          }`} style={{ borderRadius: '9999px', gap: '4px' }}>
          <Zap className="w-3 h-3" /> Быстрый завтрак
        </button>
        <button onClick={() => setQuickFilter(quickFilter === 'packable' ? 'none' : 'packable')}
          className={`flex items-center px-3 py-1.5 text-xs font-heading font-semibold border transition-colors ${
            quickFilter === 'packable'
              ? 'bg-miso/20 text-miso border-miso/50'
              : 'bg-rift text-text-dim border-nebula hover:border-miso/30'
          }`} style={{ borderRadius: '9999px', gap: '4px' }}>
          <Briefcase className="w-3 h-3" /> С собой на работу
        </button>
      </div>

      {/* Category filter */}
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

      {/* Recipe list */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-dimension border border-nebula rounded-card p-5 text-center">
          <p className="text-text-mid font-body">Рецепты не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipe/${recipe.id}`}
              className="bg-dimension border border-nebula rounded-card p-4 shadow-card hover:border-portal/30 hover:shadow-glow transition-all cursor-pointer block card-hover"
            >
              <div className="flex items-start justify-between mb-2" style={{ gap: '10px' }}>
                <h3 className="font-heading font-semibold text-text-light">
                  {recipe.title}
                </h3>
                <span
                  className="flex-shrink-0 text-xs px-3 py-1 font-heading font-semibold border"
                  style={{ borderRadius: '9999px', ...MEMBER_BADGE[recipe.suitableFor] }}
                >
                  {MEMBER_LABELS[recipe.suitableFor]}
                </span>
              </div>
              {recipe.subtitle && (
                <p className="text-sm text-text-dim font-body mb-2">{recipe.subtitle}</p>
              )}
              <div className="flex items-center text-xs font-mono text-portal mb-2" style={{ gap: '8px' }}>
                <span>⏱ {recipe.totalTime} мин</span>
                <span className="text-text-dim">·</span>
                <span>{recipe.servings} порций</span>
              </div>
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: '6px' }}>
                  {recipe.tags.map((tag) => (
                    <span key={tag}
                      className={`text-[11px] px-2.5 py-0.5 font-heading border ${getTagStyle(tag)}`}
                      style={{ borderRadius: '9999px' }}>
                      {TAG_LABELS[tag] || tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

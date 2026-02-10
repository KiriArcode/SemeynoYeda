import { useState, useEffect } from 'react';
import type React from 'react';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import type { Recipe, FamilyMember, MealType } from '../../data/schema';
import { Modal } from '../ui/Modal';
import { Search } from 'lucide-react';

const MEMBER_BADGE: Record<string, React.CSSProperties> = {
  kolya: { background: 'rgba(0,229,255,0.10)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.25)' },
  kristina: { background: 'rgba(255,107,157,0.10)', color: '#FF6B9D', borderColor: 'rgba(255,107,157,0.25)' },
  both: { background: 'rgba(57,255,20,0.10)', color: '#39FF14', borderColor: 'rgba(57,255,20,0.25)' },
};

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: Recipe) => void;
  currentRecipeId?: string;
  filterForWhom?: FamilyMember;
  filterMealType?: MealType;
}

export function SwapModal({ isOpen, onClose, onSelect, currentRecipeId, filterForWhom }: SwapModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen]);

  async function loadRecipes() {
    setLoading(true);
    try {
      const all = await dataService.recipes.list();
      setRecipes(all);
    } catch (error) {
      logger.error('[SwapModal] Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = recipes.filter(r => {
    if (r.id === currentRecipeId) return false;
    if (filterForWhom && filterForWhom !== 'both' && r.suitableFor !== filterForWhom && r.suitableFor !== 'both') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.category.includes(q)) return false;
    }
    return true;
  });

  function handleSelect(recipe: Recipe) {
    logger.log(`[SwapModal] Selected: ${recipe.title}`);
    onSelect(recipe);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Заменить блюдо">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск рецептов..."
            className="w-full bg-rift border border-nebula rounded-button px-3 py-2 pl-9 text-sm text-text-light font-body focus:outline-none focus:border-portal"
          />
        </div>

        {loading ? (
          <p className="text-text-dim font-body text-sm">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-dim font-body text-sm">Нет подходящих рецептов</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => handleSelect(r)}
                className="w-full text-left p-2 rounded-button hover:bg-rift border border-transparent hover:border-portal/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-text-light">{r.title}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 font-heading font-semibold border"
                    style={{ borderRadius: '9999px', ...MEMBER_BADGE[r.suitableFor] }}
                  >
                    {r.suitableFor === 'kolya' ? 'Коля' : r.suitableFor === 'kristina' ? 'Кристина' : 'Оба'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-text-dim mt-0.5">
                  {r.totalTime} мин · {r.category}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

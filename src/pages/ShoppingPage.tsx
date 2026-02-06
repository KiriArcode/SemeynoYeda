import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useShoppingList } from '../hooks/useShoppingList';
import { ShoppingSettings } from '../components/shopping/ShoppingSettings';
import { CheckCircle2, ShoppingCart, RefreshCw } from 'lucide-react';

export default function ShoppingPage() {
  const { items, loading, loadItems, toggleChecked, clearChecked, generateShoppingList } = useShoppingList();
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual' | 'missing'>('all');
  const [generating, setGenerating] = useState(false);

  // Авто-генерация списка из текущего меню при первом посещении, если список пуст
  useEffect(() => {
    if (!loading && items.length === 0) {
      autoGenerateList();
    }
  }, [loading]);

  async function autoGenerateList() {
    setGenerating(true);
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      if (menu) {
        const newItems = await generateShoppingList(menu);
        if (newItems.length > 0) {
          await db.table('shopping').bulkPut(newItems);
          await loadItems();
        }
      }
    } catch (error) {
      console.error('Failed to auto-generate shopping list:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    setGenerating(true);
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      if (menu) {
        const newItems = await generateShoppingList(menu);
        if (newItems.length > 0) {
          await db.table('shopping').clear();
          await db.table('shopping').bulkPut(newItems);
          await loadItems();
        }
      }
    } catch (error) {
      console.error('Failed to regenerate shopping list:', error);
    } finally {
      setGenerating(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.source === filter;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const categoryLabels: Record<string, string> = {
    мясо: '🥩 Мясо',
    молочка: '🥛 Молочные продукты',
    овощи: '🥕 Овощи',
    крупы: '🌾 Крупы',
    другое: '📦 Другое',
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-portal" />
          <h1 className="font-heading text-2xl font-bold text-text-light">
            Список покупок
          </h1>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Генерация...' : 'Из меню'}
        </button>
      </div>

      {/* Настройки */}
      <div className="mb-6">
        <ShoppingSettings />
      </div>

      {/* Прогресс */}
      {items.length > 0 && (
        <div className="bg-dimension border border-nebula rounded-card p-5 mb-6 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-heading font-semibold text-text-light">
              Прогресс
            </span>
            <span className="text-sm font-mono text-portal">{progress}%</span>
          </div>
          <div className="h-2 bg-rift rounded-pill overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-portal to-portal-dim transition-all duration-300 shadow-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2">
          {(['all', 'auto', 'manual', 'missing'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-button font-heading font-semibold text-xs whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-gradient-to-r from-portal to-portal-dim text-void shadow-glow'
                  : 'bg-rift border border-nebula text-text-mid hover:border-portal/30'
              }`}
            >
              {f === 'all' && 'Все'}
              {f === 'auto' && 'Авто'}
              {f === 'manual' && 'Вручную'}
              {f === 'missing' && 'Отсутствует'}
            </button>
          ))}
        </div>
      </div>

      {/* Список покупок */}
      {loading ? (
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-dimension border border-nebula rounded-card p-5 text-center">
          <p className="text-text-mid font-body">
            Список покупок пуст
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="font-heading font-semibold text-text-light mb-3">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.ingredient}
                    className={`bg-dimension border rounded-card p-3 flex items-center gap-3 transition-all ${
                      item.checked
                        ? 'border-nebula opacity-60'
                        : item.markedMissing
                        ? 'border-ramen bg-ramen/10'
                        : 'border-nebula hover:border-portal/30'
                    }`}
                  >
                    <button
                      onClick={() => toggleChecked(item.ingredient)}
                      className={`flex-shrink-0 w-5 h-5 rounded-button border-2 flex items-center justify-center transition-colors ${
                        item.checked
                          ? 'bg-portal border-portal'
                          : 'border-nebula hover:border-portal'
                      }`}
                    >
                      {item.checked && <CheckCircle2 className="w-3 h-3 text-void" />}
                    </button>
                    <div className="flex-1">
                      <span
                        className={`font-body ${
                          item.checked ? 'text-text-dim line-through' : 'text-text-light'
                        }`}
                      >
                        {item.ingredient}
                      </span>
                      <span className="text-sm font-mono text-text-dim ml-2">
                        {item.totalAmount} {item.unit}
                      </span>
                    </div>
                    {item.markedMissing && (
                      <span className="text-xs text-ramen font-body">Отсутствует</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {checkedCount > 0 && (
            <button
              onClick={clearChecked}
              className="w-full px-6 py-3 bg-rift border border-nebula text-text-light font-heading font-semibold rounded-button hover:bg-nebula hover:border-portal/30 transition-colors"
            >
              Очистить купленное
            </button>
          )}
        </div>
      )}
    </div>
  );
}

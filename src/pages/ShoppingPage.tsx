import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import { useShoppingList, mergeGeneratedIntoList } from '../hooks/useShoppingList';
import { applyMinWeightOrVolume } from '../lib/shoppingListUtils';
import { ShoppingSettings } from '../components/shopping/ShoppingSettings';
import { Modal } from '../components/ui/Modal';
import { CheckCircle2, ShoppingCart, RefreshCw, Trash2, Plus } from 'lucide-react';
import type { Unit } from '../data/schema';

export function ShoppingPage() {
  const { items, loading, loadItems, toggleChecked, clearChecked, generateShoppingList, addItem, deleteItem, bulkToggleChecked, bulkDelete } = useShoppingList();
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual' | 'missing'>('all');
  const [generating, setGenerating] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Manual form state
  const [formIngredient, setFormIngredient] = useState('');
  const [formAmount, setFormAmount] = useState(1);
  const [formUnit, setFormUnit] = useState<Unit>('шт');
  const [formCategory, setFormCategory] = useState<'мясо' | 'молочка' | 'овощи' | 'крупы' | 'другое'>('другое');

  // Авто-генерация списка из текущего меню при первом посещении, если список пуст
  useEffect(() => {
    if (!loading && items.length === 0) {
      autoGenerateList();
    }
  }, [loading]);

  async function autoGenerateList() {
    setGenerating(true);
    try {
      const menu = await dataService.menus.getCurrent().catch(() => null);
      if (menu) {
        const existing = await dataService.shopping.list();
        const generated = await generateShoppingList(menu);
        const merged = mergeGeneratedIntoList(existing, generated);
        await dataService.shopping.bulkPut(merged);
        await loadItems();
      }
    } catch (error) {
      logger.error('Failed to auto-generate shopping list:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    setGenerating(true);
    try {
      const menu = await dataService.menus.getCurrent().catch(() => null);
      if (menu) {
        const existing = await dataService.shopping.list();
        const generated = await generateShoppingList(menu);
        const merged = mergeGeneratedIntoList(existing, generated);
        await dataService.shopping.bulkPut(merged);
        await loadItems();
      }
    } catch (error) {
      logger.error('Failed to regenerate shopping list:', error);
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

  const units: Unit[] = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.', 'стакан', 'щепотка', 'по вкусу'];
  const categories: Array<'мясо' | 'молочка' | 'овощи' | 'крупы' | 'другое'> = ['мясо', 'молочка', 'овощи', 'крупы', 'другое'];

  function handleFilterClick(f: 'all' | 'auto' | 'manual' | 'missing') {
    setFilter(f);
  }

  async function handleManualAdd() {
    if (!formIngredient.trim()) return;
    const { totalAmount } = applyMinWeightOrVolume({ totalAmount: formAmount, unit: formUnit });
    try {
      await addItem({
        ingredient: formIngredient.trim(),
        totalAmount,
        unit: formUnit,
        category: formCategory,
        recipeIds: [],
        source: 'manual',
      });
      setFormIngredient('');
      setFormAmount(1);
      setFormUnit('шт');
      setFormCategory('другое');
      setShowManualForm(false);
      setFilter('manual');
    } catch (error) {
      logger.error('Failed to add manual item:', error);
    }
  }

  function toggleItemSelection(id: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  }

  function toggleSelectAll() {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  }

  async function handleBulkToggleChecked() {
    if (selectedItems.size === 0) return;
    await bulkToggleChecked(Array.from(selectedItems));
    setSelectedItems(new Set());
    setSelectionMode(false);
  }

  async function handleBulkDelete() {
    if (selectedItems.size === 0) return;
    await bulkDelete(Array.from(selectedItems));
    setSelectedItems(new Set());
    setSelectionMode(false);
  }

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

      {/* Фильтры и массовые операции */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto items-center">
          {(['all', 'auto', 'manual', 'missing'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterClick(f)}
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
          <button
            onClick={() => {
              console.log('[ShoppingPage] Добавить элемент нажато (temporary debug)');
              logger.log('[ShoppingPage] Add item button clicked');
              setShowManualForm(true);
            }}
            className="ml-auto px-3 py-1 rounded-button font-heading font-semibold text-xs whitespace-nowrap bg-portal/20 border border-portal/50 text-portal hover:bg-portal/30 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить элемент
          </button>
        </div>
        
        {filteredItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedItems(new Set());
              }}
              className={`px-3 py-1 rounded-button font-heading font-semibold text-xs transition-colors ${
                selectionMode
                  ? 'bg-portal text-void'
                  : 'bg-rift border border-nebula text-text-mid hover:border-portal/30'
              }`}
            >
              {selectionMode ? 'Отменить выбор' : 'Выбрать'}
            </button>
            
            {selectionMode && (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1 rounded-button font-heading font-semibold text-xs bg-rift border border-nebula text-text-mid hover:border-portal/30 transition-colors"
                >
                  {selectedItems.size === filteredItems.length ? 'Снять все' : 'Выбрать все'}
                </button>
                {selectedItems.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkToggleChecked}
                      className="px-3 py-1 rounded-button font-heading font-semibold text-xs bg-portal/20 border border-portal/50 text-portal hover:bg-portal/30 transition-colors"
                    >
                      Отметить ({selectedItems.size})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 rounded-button font-heading font-semibold text-xs bg-ramen/20 border border-ramen/50 text-ramen hover:bg-ramen/30 transition-colors"
                    >
                      Удалить ({selectedItems.size})
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Список покупок */}
      {loading ? (
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-panel border border-elevated rounded-card p-6 text-center shadow-card">
          <div className="text-[10px] font-mono text-text-ghost tracking-widest mb-1">買い物リストは空です</div>
          <p className="text-text-secondary font-body">
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
                        : selectionMode && selectedItems.has(item.id)
                        ? 'border-portal bg-portal/10'
                        : 'border-nebula hover:border-portal/30'
                    }`}
                  >
                    {selectionMode ? (
                      <button
                        onClick={() => toggleItemSelection(item.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded-button border-2 flex items-center justify-center transition-colors ${
                          selectedItems.has(item.id)
                            ? 'bg-portal border-portal'
                            : 'border-nebula hover:border-portal'
                        }`}
                      >
                        {selectedItems.has(item.id) && <CheckCircle2 className="w-3 h-3 text-void" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleChecked(item.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded-button border-2 flex items-center justify-center transition-colors ${
                          item.checked
                            ? 'bg-portal border-portal'
                            : 'border-nebula hover:border-portal'
                        }`}
                      >
                        {item.checked && <CheckCircle2 className="w-3 h-3 text-void" />}
                      </button>
                    )}
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
                    {!selectionMode && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 text-text-ghost hover:text-ramen transition-colors"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Manual add modal */}
      <Modal
        isOpen={showManualForm}
        onClose={() => {
          setShowManualForm(false);
          setFormIngredient('');
          setFormAmount(1);
          setFormUnit('шт');
          setFormCategory('другое');
        }}
        title="Добавить продукт вручную"
        footer={
          <>
            <button
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleManualAdd}
              disabled={!formIngredient.trim()}
              className="px-4 py-2 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold text-sm rounded-button shadow-glow hover:shadow-glow/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Добавить
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="shopping-ingredient" className="block text-sm font-heading font-semibold text-text-light mb-2">
              Название продукта *
            </label>
            <input
              id="shopping-ingredient"
              name="shopping-ingredient"
              type="text"
              value={formIngredient}
              onChange={(e) => setFormIngredient(e.target.value)}
              placeholder="Например: Молоко"
              className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="shopping-amount" className="block text-sm font-heading font-semibold text-text-light mb-2">
                Количество
              </label>
              <input
                id="shopping-amount"
                name="shopping-amount"
                type="number"
                min={0.1}
                step={0.1}
                value={formAmount}
                onChange={(e) => setFormAmount(parseFloat(e.target.value) || 1)}
                className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
              />
            </div>
            
            <div>
              <label htmlFor="shopping-unit" className="block text-sm font-heading font-semibold text-text-light mb-2">
                Единица измерения
              </label>
              <select
                id="shopping-unit"
                name="shopping-unit"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value as Unit)}
                className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="shopping-category" className="block text-sm font-heading font-semibold text-text-light mb-2">
              Категория
            </label>
            <select
              id="shopping-category"
              name="shopping-category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as typeof formCategory)}
              className="w-full bg-rift border border-nebula rounded-button px-4 py-2 text-text-light font-body focus:outline-none focus:border-portal focus:ring-2 focus:ring-portal-glow"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// default export for React.lazy()
export default ShoppingPage;
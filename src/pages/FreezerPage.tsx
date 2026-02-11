import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { FreezerItem, Recipe } from '../data/schema';
import { nanoid } from 'nanoid';
import { Snowflake, Plus, Minus, Trash2, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { AlertBanner } from '../components/ui/AlertBanner';

export function FreezerPage() {
  const [items, setItems] = useState<FreezerItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<FreezerItem | null>(null);

  // Add form state
  const [formRecipeId, setFormRecipeId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPortions, setFormPortions] = useState(4);
  const [formLocation, setFormLocation] = useState('');
  const [formForWhom, setFormForWhom] = useState<'kolya' | 'kristina' | 'both'>('both');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [freezerItems, allRecipes] = await Promise.all([
        dataService.freezer.list(),
        dataService.recipes.list(),
      ]);
      setItems(freezerItems);
      setRecipes(allRecipes);
    } catch (error) {
      logger.error('[FreezerPage] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const recipe = recipes.find(r => r.id === formRecipeId);
    const name = formName || recipe?.title || 'Без названия';
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + (recipe?.storage.freezer || 3));

    const newItem: FreezerItem = {
      id: nanoid(),
      recipeId: formRecipeId || '',
      name,
      portions: formPortions,
      portionsRemaining: formPortions,
      portionsOriginal: formPortions,
      frozenDate: now.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      location: formLocation || undefined,
      forWhom: formForWhom,
    };

    logger.log('[FreezerPage] Adding item:', name, formPortions, 'portions');
    await dataService.freezer.create(newItem);
    setItems(prev => [...prev, newItem]);
    resetForm();
  }

  async function handleUsePortions(item: FreezerItem, count: number) {
    const remaining = Math.max(0, item.portionsRemaining - count);
    logger.log(`[FreezerPage] Using ${count} portions of ${item.name}, remaining: ${remaining}`);
    const updated = { ...item, portionsRemaining: remaining };
    await dataService.freezer.update(item.id, updated);
    setItems(prev => prev.map(i => i.id === item.id ? updated : i));
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      logger.log('[FreezerPage] Deleting:', deleteItem.name);
      await dataService.freezer.delete(deleteItem.id);
      setItems(prev => prev.filter(i => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (error) {
      logger.error('[FreezerPage] Failed to delete item:', error);
      // Keep modal open on error so user can retry
    }
  }

  function resetForm() {
    setShowAddForm(false);
    setFormRecipeId('');
    setFormName('');
    setFormPortions(4);
    setFormLocation('');
    setFormForWhom('both');
  }

  const FOR_WHOM_LABELS: Record<string, string> = {
    kolya: 'Коля',
    kristina: 'Кристина',
    both: 'Оба',
  };

  function getExpiryStatus(expiryDate: string): { label: string; color: string } {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { label: 'Истёк!', color: 'text-ramen' };
    if (days <= 3) return { label: `${days} дн.`, color: 'text-ramen' };
    if (days <= 7) return { label: `${days} дн.`, color: 'text-miso' };
    return { label: `${days} дн.`, color: 'text-text-dim' };
  }

  const inputClass = "w-full bg-rift border border-nebula rounded-button px-3 py-2 text-text-light font-body text-sm focus:outline-none focus:border-portal";
  const labelClass = "block text-xs font-heading font-semibold text-text-dim mb-1";

  // Alerts
  const expiringItems = items.filter(i => {
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 3;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка морозилки...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-text-light flex items-center gap-2">
          <Snowflake className="w-6 h-6 text-frost" /> Морозилка
        </h1>
        <button
          onClick={() => {
            logger.log('[FreezerPage] Add to freezer button clicked');
            setShowAddForm(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-heading font-semibold text-frost border border-frost/50 rounded-button hover:bg-frost/10 transition-colors">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {/* Alerts */}
      {expiringItems.map(item => (
        <AlertBanner key={item.id} type="expiring" message={`${item.name} — истекает!`} className="mb-3" />
      ))}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-dimension border border-portal/30 rounded-card p-4 mb-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-text-light text-sm">Добавить в морозилку</h3>
            <button onClick={resetForm} className="text-text-ghost hover:text-text-mid"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Рецепт (необязательно)</label>
              <select value={formRecipeId} onChange={e => {
                setFormRecipeId(e.target.value);
                const r = recipes.find(r => r.id === e.target.value);
                if (r) setFormName(r.title);
              }} className={inputClass}>
                <option value="">Без привязки к рецепту</option>
                {recipes.filter(r => r.tags.includes('freezable') || r.storage.freezer).map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Название *</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className={inputClass} placeholder="Котлеты куриные" />
            </div>
            <div>
              <label className={labelClass}>Для кого</label>
              <select value={formForWhom} onChange={e => setFormForWhom(e.target.value as 'kolya' | 'kristina' | 'both')} className={inputClass}>
                <option value="both">Оба</option>
                <option value="kolya">Коля</option>
                <option value="kristina">Кристина</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Порции</label>
                <input type="number" min={1} value={formPortions} onChange={e => setFormPortions(+e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Место</label>
                <input value={formLocation} onChange={e => setFormLocation(e.target.value)} className={inputClass} placeholder="Ящик 1" />
              </div>
            </div>
            <button onClick={handleAdd} disabled={!formName.trim()}
              className="w-full px-4 py-2 bg-gradient-to-r from-frost to-frost/70 text-void font-heading font-semibold text-sm rounded-button disabled:opacity-50">
              Заморозить
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="bg-panel border border-elevated rounded-card p-6 text-center shadow-card">
          <Snowflake className="w-10 h-10 text-frost/30 mx-auto mb-3" />
          <div className="text-[10px] font-mono text-text-ghost tracking-widest mb-1">冷凍庫は空です</div>
          <p className="text-text-secondary font-body">Морозилка пуста</p>
          <p className="text-xs text-text-muted font-body mt-1">Добавьте заготовки после prep day</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const expiry = getExpiryStatus(item.expiryDate);
            const portionPercent = item.portionsOriginal > 0 ? (item.portionsRemaining / item.portionsOriginal) * 100 : 0;
            return (
              <div key={item.id} className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-sm font-heading font-semibold text-text-light">{item.name}</h3>
                      {item.forWhom && (
                        <span
                          className="text-[10px] px-2 py-0.5 font-heading font-semibold border rounded-pill"
                          style={{
                            background: item.forWhom === 'kolya' ? 'rgba(0,229,255,0.10)' : item.forWhom === 'kristina' ? 'rgba(255,107,157,0.10)' : 'rgba(57,255,20,0.10)',
                            color: item.forWhom === 'kolya' ? '#00E5FF' : item.forWhom === 'kristina' ? '#FF6B9D' : '#39FF14',
                            borderColor: item.forWhom === 'kolya' ? 'rgba(0,229,255,0.25)' : item.forWhom === 'kristina' ? 'rgba(255,107,157,0.25)' : 'rgba(57,255,20,0.25)',
                          }}
                        >
                          {FOR_WHOM_LABELS[item.forWhom]}
                        </span>
                      )}
                      {item.location && (
                        <span className="text-[10px] px-2 py-0.5 bg-rift border border-nebula text-text-dim font-body rounded-full">
                          {item.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-body text-text-dim">
                      <span>Заморожено: {new Date(item.frozenDate).toLocaleDateString('ru-RU')}</span>
                      <span className={expiry.color}>До: {new Date(item.expiryDate).toLocaleDateString('ru-RU')} ({expiry.label})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItem(item);
                      }} 
                      className="p-1 text-text-ghost hover:text-ramen transition-colors"
                      aria-label="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Portions bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-mid">
                      {item.portionsRemaining} / {item.portionsOriginal} порц.
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleUsePortions(item, 1)} disabled={item.portionsRemaining <= 0}
                        className="px-2 py-0.5 text-xs font-heading font-semibold text-frost border border-frost/40 rounded-button hover:bg-frost/10 transition-colors disabled:opacity-30 gap-0.5">
                        <Minus className="w-3 h-3 inline" /> 1
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-rift rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-all ${portionPercent > 30 ? 'bg-frost' : portionPercent > 0 ? 'bg-ramen' : 'bg-text-ghost'}`}
                      style={{ width: `${portionPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Удалить из морозилки?"
        footer={
          <>
            <button onClick={() => setDeleteItem(null)}
              className="px-4 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors">
              Отмена
            </button>
            <button onClick={handleDelete}
              className="px-4 py-2 bg-ramen text-void font-heading font-semibold text-sm rounded-button hover:bg-ramen/80 transition-colors">
              Удалить
            </button>
          </>
        }
      >
        <p>«{deleteItem?.name}» будет удалено из морозилки.</p>
      </Modal>
    </div>
  );
}

// default export for React.lazy()
export default FreezerPage;

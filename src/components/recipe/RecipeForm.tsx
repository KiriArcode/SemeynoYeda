import { useState } from 'react';
import type { Recipe, DietTag, FamilyMember, EquipmentId, Ingredient, RecipeStep, Unit } from '../../data/schema';
import { Plus, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

interface RecipeFormProps {
  initial?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

const CATEGORIES: { value: Recipe['category']; label: string }[] = [
  { value: 'main', label: 'Основное' },
  { value: 'sauce', label: 'Соус' },
  { value: 'side', label: 'Гарнир' },
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'snack', label: 'Полдник' },
  { value: 'soup', label: 'Суп' },
  { value: 'dessert', label: 'Десерт' },
];

const TAG_OPTIONS: { value: DietTag; label: string }[] = [
  { value: 'gastritis-safe', label: 'Щадящее' },
  { value: 'soft-texture', label: 'Мягкая текстура' },
  { value: 'rich-feel', label: 'Сытное' },
  { value: 'freezable', label: 'Можно заморозить' },
  { value: 'quick', label: 'Быстро' },
  { value: 'prep-day', label: 'Заготовка' },
  { value: 'batch-cooking', label: 'Массовая готовка' },
  { value: 'overnight', label: 'С вечера' },
  { value: 'packable', label: 'С собой' },
  { value: 'low-calorie', label: 'Низкокалорийное' },
];

const MEMBER_OPTIONS: { value: FamilyMember; label: string }[] = [
  { value: 'kolya', label: 'Коля' },
  { value: 'kristina', label: 'Кристина' },
  { value: 'both', label: 'Оба' },
];

const EQUIPMENT_OPTIONS: { value: EquipmentId; label: string }[] = [
  { value: 'stove', label: 'Плита' },
  { value: 'oven', label: 'Духовка' },
  { value: 'air-grill', label: 'Аэрогриль' },
  { value: 'e-grill', label: 'Электрогриль' },
  { value: 'steamer', label: 'Пароварка' },
  { value: 'blender', label: 'Блендер' },
  { value: 'mixer', label: 'Миксер' },
  { value: 'grinder', label: 'Гриндер' },
  { value: 'vacuum', label: 'Вакууматор' },
  { value: 'bowls', label: 'Миски' },
];

const UNITS: Unit[] = ['г', 'кг', 'мл', 'л', 'шт', 'ст.л.', 'ч.л.', 'стакан', 'щепотка', 'по вкусу'];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function RecipeForm({ initial, onSave, onCancel }: RecipeFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle || '');
  const [category, setCategory] = useState<Recipe['category']>(initial?.category || 'main');
  const [suitableFor, setSuitableFor] = useState<FamilyMember>(initial?.suitableFor || 'both');
  const [tags, setTags] = useState<DietTag[]>(initial?.tags || []);
  const [prepTime, setPrepTime] = useState(initial?.prepTime || 10);
  const [cookTime, setCookTime] = useState(initial?.cookTime || 20);
  const [servings, setServings] = useState(initial?.servings || 2);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initial?.ingredients || [{ name: '', amount: 0, unit: 'г' }]);
  const [steps, setSteps] = useState<RecipeStep[]>(initial?.steps || [{ order: 1, text: '' }]);
  const [equipment, setEquipment] = useState<EquipmentId[]>(initial?.equipment || []);
  const [fridgeDays, setFridgeDays] = useState(initial?.storage.fridge || 0);
  const [freezerMonths, setFreezerMonths] = useState(initial?.storage.freezer || 0);
  const [vacuumSealed, setVacuumSealed] = useState(initial?.storage.vacuumSealed || false);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: DietTag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleEquipment(eq: EquipmentId) {
    setEquipment(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]);
  }

  function addIngredient() {
    setIngredients(prev => [...prev, { name: '', amount: 0, unit: 'г' as Unit }]);
  }

  function removeIngredient(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  }

  function updateIngredient(idx: number, field: keyof Ingredient, value: string | number | boolean) {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  }

  function addStep() {
    setSteps(prev => [...prev, { order: prev.length + 1, text: '' }]);
  }

  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  }

  function updateStep(idx: number, field: keyof RecipeStep, value: unknown) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: initial?.id || nanoid(),
      slug: initial?.slug || slugify(title),
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      category,
      tags,
      suitableFor,
      prepTime,
      cookTime,
      totalTime: prepTime + cookTime,
      servings,
      ingredients: ingredients.filter(i => i.name.trim()),
      steps: steps.filter(s => s.text.trim()),
      equipment,
      notes: notes.trim() || undefined,
      storage: {
        fridge: fridgeDays || undefined,
        freezer: freezerMonths || undefined,
        vacuumSealed: vacuumSealed || undefined,
      },
      source: initial?.source,
      imageUrl: initial?.imageUrl,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    };

    console.log(`[RecipeForm] Saving recipe: ${recipe.title}`);
    onSave(recipe);
    setSaving(false);
  }

  const inputClass = "w-full bg-rift border border-nebula rounded-button px-3 py-2 text-text-light font-body text-sm focus:outline-none focus:border-portal focus:ring-1 focus:ring-portal-glow";
  const labelClass = "block text-xs font-heading font-semibold text-text-dim mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Основные поля */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card space-y-3">
        <div>
          <label className={labelClass}>Название *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Куриные котлеты" required />
        </div>
        <div>
          <label className={labelClass}>Подзаголовок</label>
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className={inputClass} placeholder="база для Коли" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: '12px' }}>
          <div>
            <label className={labelClass}>Категория</label>
            <select value={category} onChange={e => setCategory(e.target.value as Recipe['category'])} className={inputClass}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Для кого</label>
            <select value={suitableFor} onChange={e => setSuitableFor(e.target.value as FamilyMember)} className={inputClass}>
              {MEMBER_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3" style={{ gap: '12px' }}>
          <div>
            <label className={labelClass}>Подготовка (мин)</label>
            <input type="number" min={0} value={prepTime} onChange={e => setPrepTime(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Готовка (мин)</label>
            <input type="number" min={0} value={cookTime} onChange={e => setCookTime(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Порций</label>
            <input type="number" min={1} value={servings} onChange={e => setServings(+e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Теги */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
        <label className={labelClass}>Теги</label>
        <div className="flex flex-wrap" style={{ gap: '6px' }}>
          {TAG_OPTIONS.map(t => (
            <button key={t.value} type="button" onClick={() => toggleTag(t.value)}
              className={`text-xs px-3 py-1 font-heading border transition-colors ${
                tags.includes(t.value)
                  ? 'bg-portal/20 text-portal border-portal/50'
                  : 'bg-rift text-text-dim border-nebula hover:border-portal/30'
              }`} style={{ borderRadius: '9999px' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ингредиенты */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
        <label className={labelClass}>Ингредиенты</label>
        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-center" style={{ gap: '8px' }}>
              <input value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} className={`${inputClass} flex-1`} placeholder="Название" />
              <input type="number" min={0} step="any" value={ing.amount || ''} onChange={e => updateIngredient(idx, 'amount', +e.target.value)} className={`${inputClass} w-20`} placeholder="Кол-во" />
              <select value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} className={`${inputClass} w-24`}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <button type="button" onClick={() => removeIngredient(idx)} className="text-text-ghost hover:text-ramen transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addIngredient} className="mt-2 flex items-center text-xs text-portal font-heading font-semibold" style={{ gap: '4px' }}>
          <Plus className="w-3.5 h-3.5" /> Добавить ингредиент
        </button>
      </div>

      {/* Шаги */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
        <label className={labelClass}>Шаги приготовления</label>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start" style={{ gap: '8px' }}>
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rift border border-nebula flex items-center justify-center text-xs font-heading font-semibold text-portal mt-2">
                {step.order}
              </span>
              <div className="flex-1 space-y-1">
                <textarea value={step.text} onChange={e => updateStep(idx, 'text', e.target.value)}
                  className={`${inputClass} min-h-[60px] resize-y`} placeholder="Описание шага..." rows={2} />
                <div className="flex" style={{ gap: '8px' }}>
                  <input type="number" min={0} value={step.duration || ''} onChange={e => updateStep(idx, 'duration', +e.target.value || undefined)}
                    className={`${inputClass} w-24`} placeholder="Мин" />
                  <label className="flex items-center text-xs text-text-dim font-body" style={{ gap: '4px' }}>
                    <input type="checkbox" checked={step.parallel || false} onChange={e => updateStep(idx, 'parallel', e.target.checked)} className="accent-portal" />
                    Параллельно
                  </label>
                </div>
              </div>
              <button type="button" onClick={() => removeStep(idx)} className="text-text-ghost hover:text-ramen transition-colors p-1 mt-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-2 flex items-center text-xs text-portal font-heading font-semibold" style={{ gap: '4px' }}>
          <Plus className="w-3.5 h-3.5" /> Добавить шаг
        </button>
      </div>

      {/* Оборудование */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
        <label className={labelClass}>Оборудование</label>
        <div className="flex flex-wrap" style={{ gap: '6px' }}>
          {EQUIPMENT_OPTIONS.map(eq => (
            <button key={eq.value} type="button" onClick={() => toggleEquipment(eq.value)}
              className={`text-xs px-3 py-1 font-heading border transition-colors ${
                equipment.includes(eq.value)
                  ? 'bg-frost/20 text-frost border-frost/50'
                  : 'bg-rift text-text-dim border-nebula hover:border-frost/30'
              }`} style={{ borderRadius: '9999px' }}>
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Хранение */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
        <label className={labelClass}>Хранение</label>
        <div className="grid grid-cols-3" style={{ gap: '12px' }}>
          <div>
            <label className={labelClass}>Холодильник (дней)</label>
            <input type="number" min={0} value={fridgeDays || ''} onChange={e => setFridgeDays(+e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Морозилка (мес.)</label>
            <input type="number" min={0} value={freezerMonths || ''} onChange={e => setFreezerMonths(+e.target.value)} className={inputClass} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center text-xs text-text-dim font-body" style={{ gap: '6px' }}>
              <input type="checkbox" checked={vacuumSealed} onChange={e => setVacuumSealed(e.target.checked)} className="accent-portal" />
              Вакуум
            </label>
          </div>
        </div>
      </div>

      {/* Заметки */}
      <div className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
        <label className={labelClass}>Заметки</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Советы, вариации..." rows={3} />
      </div>

      {/* Кнопки */}
      <div className="flex justify-end" style={{ gap: '12px' }}>
        <button type="button" onClick={onCancel}
          className="px-5 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors">
          Отмена
        </button>
        <button type="submit" disabled={saving || !title.trim()}
          className="px-5 py-2 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold text-sm rounded-button shadow-glow hover:shadow-glow/80 transition-shadow disabled:opacity-50">
          {saving ? 'Сохранение...' : (initial ? 'Сохранить' : 'Создать')}
        </button>
      </div>
    </form>
  );
}

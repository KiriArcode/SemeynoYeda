import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Recipe, DietTag, FamilyMember, EquipmentId } from '../data/schema';
import { Clock, Users, Snowflake, Thermometer } from 'lucide-react';

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

const EQUIPMENT_LABELS: Record<EquipmentId, string> = {
  stove: 'Плита',
  oven: 'Духовка',
  'air-grill': 'Аэрогриль',
  'e-grill': 'Электрогриль',
  steamer: 'Пароварка',
  blender: 'Блендер',
  mixer: 'Миксер',
  grinder: 'Гриндер',
  vacuum: 'Вакууматор',
  bowls: 'Миски',
};

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRecipe(id);
    }
  }, [id]);

  async function loadRecipe(recipeId: string) {
    try {
      const loaded = await db.table('recipes').get(recipeId);
      setRecipe(loaded || null);
    } catch (error) {
      console.error('Failed to load recipe:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка рецепта...</div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-5">
          <p className="text-text-mid font-body">Рецепт не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <h1 className="font-heading text-3xl font-bold text-text-light mb-2">
        {recipe.title}
      </h1>
      {recipe.subtitle && (
        <p className="text-text-mid font-body mb-4">{recipe.subtitle}</p>
      )}

      {/* Для кого и теги */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-pill font-heading font-semibold ${
          recipe.suitableFor === 'kolya'
            ? 'bg-portal/20 text-portal'
            : recipe.suitableFor === 'kristina'
            ? 'bg-ramen/20 text-ramen'
            : 'bg-plasma/20 text-plasma'
        }`}>
          {MEMBER_LABELS[recipe.suitableFor]}
        </span>
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-0.5 rounded-pill font-heading ${
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

      {/* Мета: время, порции */}
      <div className="flex items-center gap-4 mb-6 text-sm font-mono text-portal">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          ⏱ {recipe.totalTime} мин
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {recipe.servings} порций
        </span>
      </div>

      {/* Оборудование и хранение */}
      {(recipe.equipment.length > 0 || recipe.storage.fridge || recipe.storage.freezer) && (
        <div className="bg-dimension border border-nebula rounded-card p-5 mb-6 shadow-card">
          {recipe.equipment.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-heading font-semibold text-text-light mb-2">
                Оборудование
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.equipment.map((eq) => (
                  <span key={eq} className="text-xs px-2.5 py-1 bg-rift border border-nebula rounded-pill text-text-mid font-body">
                    {EQUIPMENT_LABELS[eq]}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(recipe.storage.fridge || recipe.storage.freezer) && (
            <div className={recipe.equipment.length > 0 ? 'pt-3 border-t border-nebula' : ''}>
              <h3 className="text-sm font-heading font-semibold text-text-light mb-2">
                Хранение
              </h3>
              <div className="flex flex-wrap gap-3 text-xs font-body text-text-mid">
                {recipe.storage.fridge && (
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-ramen" />
                    Холодильник: {recipe.storage.fridge} дн.
                  </span>
                )}
                {recipe.storage.freezer && (
                  <span className="flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5 text-frost" />
                    Морозилка: {recipe.storage.freezer} мес.
                    {recipe.storage.vacuumSealed && ' (вакуум)'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ингредиенты */}
      <div className="bg-dimension border border-nebula rounded-card p-5 mb-6 shadow-card">
        <h2 className="font-heading text-xl font-bold text-text-light mb-4">
          Ингредиенты
        </h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-center gap-2 text-text-mid font-body">
              <span className="text-portal">•</span>
              <span>
                {ingredient.amount} {ingredient.unit} {ingredient.name}
                {ingredient.note && <span className="text-text-dim"> ({ingredient.note})</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Шаги приготовления */}
      <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
        <h2 className="font-heading text-xl font-bold text-text-light mb-4">
          Приготовление
        </h2>
        <ol className="space-y-4">
          {recipe.steps.map((step) => (
            <li key={step.order} className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-rift border border-nebula flex items-center justify-center text-sm font-heading font-semibold text-portal">
                {step.order}
              </span>
              <div className="flex-1">
                <p className="text-text-light font-body mb-1">{step.text}</p>
                {step.equipment && (
                  <p className="text-sm text-text-dim font-body">
                    {step.equipment.label}
                    {step.equipment.settings && ` · ${step.equipment.settings}`}
                  </p>
                )}
                {step.duration && (
                  <p className="text-xs font-mono text-portal mt-1">
                    ⏱ {step.duration} мин
                  </p>
                )}
                {step.tip && (
                  <p className="text-xs text-text-dim font-body mt-1 italic">
                    💡 {step.tip}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {recipe.notes && (
        <div className="bg-dimension border border-nebula rounded-card p-5 mt-6 shadow-card">
          <h3 className="font-heading font-semibold text-text-light mb-2">
            Заметки
          </h3>
          <p className="text-text-mid font-body">{recipe.notes}</p>
        </div>
      )}
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { Recipe } from '../data/schema';
import { Clock, Users } from 'lucide-react';

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
        <p className="text-text-mid font-body mb-6">{recipe.subtitle}</p>
      )}

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

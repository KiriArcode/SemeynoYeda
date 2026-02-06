import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { RecipeForm } from '../components/recipe/RecipeForm';
import type { Recipe } from '../data/schema';

export default function RecipeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      db.table('recipes').get(id).then(r => {
        setRecipe(r || null);
        setLoading(false);
      });
    }
  }, [id]);

  async function handleSave(updated: Recipe) {
    console.log('[RecipeEditPage] Updating recipe:', updated.title);
    await db.table('recipes').put(updated);
    navigate(`/recipe/${updated.id}`);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка...</div>
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
      <h1 className="font-heading text-2xl font-bold text-text-light mb-6">
        Редактировать: {recipe.title}
      </h1>
      <RecipeForm initial={recipe} onSave={handleSave} onCancel={() => navigate(-1)} />
    </div>
  );
}

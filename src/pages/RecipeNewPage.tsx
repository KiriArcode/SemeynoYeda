import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { RecipeForm } from '../components/recipe/RecipeForm';
import type { Recipe } from '../data/schema';

export default function RecipeNewPage() {
  const navigate = useNavigate();

  async function handleSave(recipe: Recipe) {
    console.log('[RecipeNewPage] Creating recipe:', recipe.title);
    await db.table('recipes').add(recipe);
    navigate(`/recipe/${recipe.id}`);
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <h1 className="font-heading text-2xl font-bold text-text-light mb-6">
        Новый рецепт
      </h1>
      <RecipeForm onSave={handleSave} onCancel={() => navigate(-1)} />
    </div>
  );
}

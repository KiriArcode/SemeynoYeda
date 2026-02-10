import { useNavigate } from 'react-router-dom';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import { RecipeForm } from '../components/recipe/RecipeForm';
import type { Recipe } from '../data/schema';

export function RecipeNewPage() {
  const navigate = useNavigate();

  async function handleSave(recipe: Recipe) {
    logger.log('[RecipeNewPage] Creating recipe:', recipe.title);
    await dataService.recipes.create(recipe);
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

// default export for React.lazy()
export default RecipeNewPage;

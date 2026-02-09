import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as recipeRepo from '../_lib/repositories/recipeRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'Missing recipe id' });
  }

  try {
    if (req.method === 'GET') {
      const recipe = await recipeRepo.getRecipeById(id);
      if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
      return res.status(200).json(recipe);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const recipe = await recipeRepo.updateRecipe(id, body);
      if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
      return res.status(200).json(recipe);
    }

    if (req.method === 'DELETE') {
      const deleted = await recipeRepo.deleteRecipe(id);
      if (!deleted) return res.status(404).json({ error: 'Recipe not found' });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/recipes/${id}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

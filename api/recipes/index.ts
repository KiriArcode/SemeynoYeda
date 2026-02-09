import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as recipeRepo from '../_lib/repositories/recipeRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const tagsParam = typeof req.query.tags === 'string' ? req.query.tags : undefined;
      const tags = tagsParam ? tagsParam.split(',') : undefined;

      const recipes = await recipeRepo.getRecipes({ category, tags });
      return res.status(200).json(recipes);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const recipe = await recipeRepo.createRecipe(body);
      return res.status(201).json(recipe);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/recipes] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

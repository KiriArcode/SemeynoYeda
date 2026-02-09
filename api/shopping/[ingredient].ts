import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as shoppingRepo from '../_lib/repositories/shoppingRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ingredient = decodeURIComponent((req.query.ingredient as string) ?? '');
  if (!ingredient) return res.status(400).json({ error: 'Missing ingredient' });

  try {
    if (req.method === 'GET') {
      const item = await shoppingRepo.getShoppingItemByIngredient(ingredient);
      if (!item) return res.status(404).json({ error: 'Shopping item not found' });
      return res.status(200).json(item);
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await shoppingRepo.updateShoppingItem(ingredient, body);
      if (!item) return res.status(404).json({ error: 'Shopping item not found' });
      return res.status(200).json(item);
    }

    if (req.method === 'DELETE') {
      await shoppingRepo.deleteShoppingItem(ingredient);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/shopping/${ingredient}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as shoppingRepo from '../_lib/repositories/shoppingRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const items = await shoppingRepo.getShoppingItems();
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (Array.isArray(body)) {
        await shoppingRepo.bulkPutShoppingItems(body);
        return res.status(200).json(body);
      }
      const item = await shoppingRepo.createShoppingItem(body);
      return res.status(201).json(item);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (Array.isArray(body)) {
        await shoppingRepo.bulkPutShoppingItems(body);
        return res.status(200).json(body);
      }
      return res.status(400).json({ error: 'Expected array for bulk update' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/shopping] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

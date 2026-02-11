import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as shoppingRepo from '../_lib/repositories/shoppingRepo.js';

/**
 * Единый обработчик /api/shopping и /api/shopping/:id (по id элемента списка).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string[] | undefined) ?? [];
  const id = slug[0] ? decodeURIComponent(slug[0]) : '';

  try {
    if (id) {
      // /api/shopping/:id
      if (req.method === 'GET') {
        const item = await shoppingRepo.getShoppingItemById(id);
        if (!item) return res.status(404).json({ error: 'Shopping item not found' });
        return res.status(200).json(item);
      }
      if (req.method === 'PATCH') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const item = await shoppingRepo.updateShoppingItem(id, body);
        if (!item) return res.status(404).json({ error: 'Shopping item not found' });
        return res.status(200).json(item);
      }
      if (req.method === 'DELETE') {
        await shoppingRepo.deleteShoppingItem(id);
        return res.status(204).end();
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // /api/shopping (list, create, bulk)
    if (req.method === 'GET') {
      const items = await shoppingRepo.getShoppingItems();
      return res.status(200).json(items);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as menuRepo from '../_lib/repositories/menuRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const id = typeof req.query.id === 'string' ? req.query.id : undefined;

      if (id) {
        const menu = await menuRepo.getMenuById(id);
        if (!menu) return res.status(404).json({ error: 'Menu not found' });
        return res.status(200).json(menu);
      }

      const menu = await menuRepo.getCurrentMenu();
      if (!menu) return res.status(404).json({ error: 'No menu found' });
      return res.status(200).json(menu);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const menu = await menuRepo.createMenu(body);
      return res.status(201).json(menu);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/menus] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

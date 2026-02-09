import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as menuRepo from '../_lib/repositories/menuRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing menu id' });

  try {
    if (req.method === 'GET') {
      const menu = await menuRepo.getMenuById(id);
      if (!menu) return res.status(404).json({ error: 'Menu not found' });
      return res.status(200).json(menu);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const menu = await menuRepo.updateMenu(id, body);
      if (!menu) return res.status(404).json({ error: 'Menu not found' });
      return res.status(200).json(menu);
    }

    if (req.method === 'DELETE') {
      await menuRepo.deleteMenu(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/menus/${id}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as freezerRepo from '../_lib/repositories/freezerRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing freezer item id' });

  try {
    if (req.method === 'GET') {
      const item = await freezerRepo.getFreezerItemById(id);
      if (!item) return res.status(404).json({ error: 'Freezer item not found' });
      return res.status(200).json(item);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await freezerRepo.updateFreezerItem(id, body);
      if (!item) return res.status(404).json({ error: 'Freezer item not found' });
      return res.status(200).json(item);
    }

    if (req.method === 'DELETE') {
      await freezerRepo.deleteFreezerItem(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/freezer/${id}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

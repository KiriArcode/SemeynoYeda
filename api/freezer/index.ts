import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as freezerRepo from '../_lib/repositories/freezerRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const items = await freezerRepo.getFreezerItems();
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await freezerRepo.createFreezerItem(body);
      return res.status(201).json(item);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/freezer] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

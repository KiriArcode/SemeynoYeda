import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cookingSessionRepo from '../_lib/repositories/cookingSessionRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing cooking session id' });

  try {
    if (req.method === 'GET') {
      const session = await cookingSessionRepo.getCookingSessionById(id);
      if (!session) return res.status(404).json({ error: 'Cooking session not found' });
      return res.status(200).json(session);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const session = await cookingSessionRepo.updateCookingSession(id, body);
      if (!session) return res.status(404).json({ error: 'Cooking session not found' });
      return res.status(200).json(session);
    }

    if (req.method === 'DELETE') {
      await cookingSessionRepo.deleteCookingSession(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/cooking-sessions/${id}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

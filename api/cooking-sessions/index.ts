import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cookingSessionRepo from '../_lib/repositories/cookingSessionRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const id = typeof req.query.id === 'string' ? req.query.id : undefined;

      if (id) {
        const session = await cookingSessionRepo.getCookingSessionById(id);
        if (!session) return res.status(404).json({ error: 'Cooking session not found' });
        return res.status(200).json(session);
      }

      if (date) {
        const session = await cookingSessionRepo.getCookingSessionByDate(date);
        if (!session) return res.status(404).json({ error: 'Cooking session not found' });
        return res.status(200).json(session);
      }

      const sessions = await cookingSessionRepo.getCookingSessions();
      return res.status(200).json(sessions);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const session = await cookingSessionRepo.createCookingSession(body);
      return res.status(201).json(session);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, ...updates } = body;
      if (!id) return res.status(400).json({ error: 'Missing session id' });
      const session = await cookingSessionRepo.updateCookingSession(id, updates);
      if (!session) return res.status(404).json({ error: 'Cooking session not found' });
      return res.status(200).json(session);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/cooking-sessions] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

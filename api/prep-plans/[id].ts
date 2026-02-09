import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as prepPlanRepo from '../_lib/repositories/prepPlanRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing prep plan id' });

  try {
    if (req.method === 'GET') {
      const plan = await prepPlanRepo.getPrepPlanById(id);
      if (!plan) return res.status(404).json({ error: 'Prep plan not found' });
      return res.status(200).json(plan);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const plan = await prepPlanRepo.updatePrepPlan(id, body);
      if (!plan) return res.status(404).json({ error: 'Prep plan not found' });
      return res.status(200).json(plan);
    }

    if (req.method === 'DELETE') {
      await prepPlanRepo.deletePrepPlan(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/prep-plans/${id}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

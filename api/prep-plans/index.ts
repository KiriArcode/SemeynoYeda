import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as prepPlanRepo from '../_lib/repositories/prepPlanRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const id = typeof req.query.id === 'string' ? req.query.id : undefined;

      if (id) {
        const plan = await prepPlanRepo.getPrepPlanById(id);
        if (!plan) return res.status(404).json({ error: 'Prep plan not found' });
        return res.status(200).json(plan);
      }

      if (date) {
        const plan = await prepPlanRepo.getPrepPlanByDate(date);
        if (!plan) return res.status(404).json({ error: 'Prep plan not found' });
        return res.status(200).json(plan);
      }

      const plans = await prepPlanRepo.getPrepPlans();
      return res.status(200).json(plans);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const plan = await prepPlanRepo.createPrepPlan(body);
      return res.status(201).json(plan);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/prep-plans] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

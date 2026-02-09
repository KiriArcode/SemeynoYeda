import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as prepPlanRepo from '../_lib/repositories/prepPlanRepo';

/**
 * Единый обработчик /api/prep-plans и /api/prep-plans/:id (лимит 12 функций на Hobby).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string[] | undefined) ?? [];
  const id = slug[0];
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;

  try {
    if (id) {
      // /api/prep-plans/:id
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
    }

    // /api/prep-plans (list, get by date, create)
    if (req.method === 'GET') {
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

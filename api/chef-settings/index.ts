import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as chefSettingsRepo from '../_lib/repositories/chefSettingsRepo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const id = (typeof req.query.id === 'string' ? req.query.id : undefined) ?? 'default';
      const settings = await chefSettingsRepo.getChefSettings(id);
      if (!settings) return res.status(404).json({ error: 'Chef settings not found' });
      return res.status(200).json(settings);
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const settings = await chefSettingsRepo.upsertChefSettings(body);
      return res.status(200).json(settings);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/chef-settings] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

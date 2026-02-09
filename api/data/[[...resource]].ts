/**
 * Unified REST endpoint for all resources.
 * Routes: /api/data/:resource and /api/data/:resource/:id
 * Replaces multiple separate endpoints to stay within Vercel Hobby limit (12 functions).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as recipeRepo from '../_lib/repositories/recipeRepo';
import * as menuRepo from '../_lib/repositories/menuRepo';
import * as freezerRepo from '../_lib/repositories/freezerRepo';
import * as cookingSessionRepo from '../_lib/repositories/cookingSessionRepo';
import * as chefSettingsRepo from '../_lib/repositories/chefSettingsRepo';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  CookingSession,
  ChefModeSettings,
} from '../../src/data/schema';

type ResourceType = 'recipes' | 'menus' | 'freezer' | 'cooking-sessions' | 'chef-settings';

interface ResourceHandlers<T> {
  list?: () => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  create: (item: T) => Promise<T>;
  update: (id: string, item: Partial<T>) => Promise<T | null>;
  delete?: (id: string) => Promise<boolean>;
  getCurrent?: () => Promise<T | null>;
  getByDate?: (date: string) => Promise<T | null>;
}

const handlers: Record<ResourceType, ResourceHandlers<any>> = {
  recipes: {
    list: () => recipeRepo.getRecipes(),
    getById: (id) => recipeRepo.getRecipeById(id),
    create: (recipe: Recipe) => recipeRepo.createRecipe(recipe),
    update: (id, recipe) => recipeRepo.updateRecipe(id, recipe),
    delete: (id) => recipeRepo.deleteRecipe(id),
  },
  menus: {
    getCurrent: () => menuRepo.getCurrentMenu(),
    getById: (id) => menuRepo.getMenuById(id),
    create: (menu: WeekMenu) => menuRepo.createMenu(menu),
    update: (id, menu) => menuRepo.updateMenu(id, menu),
    delete: (id) => menuRepo.deleteMenu(id),
  },
  freezer: {
    list: () => freezerRepo.getFreezerItems(),
    getById: (id) => freezerRepo.getFreezerItemById(id),
    create: (item: FreezerItem) => freezerRepo.createFreezerItem(item),
    update: (id, item) => freezerRepo.updateFreezerItem(id, item),
    delete: (id) => freezerRepo.deleteFreezerItem(id),
  },
  'cooking-sessions': {
    list: () => cookingSessionRepo.getCookingSessions(),
    getById: (id) => cookingSessionRepo.getCookingSessionById(id),
    getByDate: (date) => cookingSessionRepo.getCookingSessionByDate(date),
    create: (session: CookingSession) => cookingSessionRepo.createCookingSession(session),
    update: (id, session) => cookingSessionRepo.updateCookingSession(id, session),
    delete: (id) => cookingSessionRepo.deleteCookingSession(id),
  },
  'chef-settings': {
    getById: (id) => chefSettingsRepo.getChefSettings(id),
    create: (settings: ChefModeSettings) => chefSettingsRepo.upsertChefSettings(settings),
    update: async (id, settings) => {
      const existing = await chefSettingsRepo.getChefSettings(id);
      if (!existing) return null;
      const merged = { ...existing, ...settings, id };
      return chefSettingsRepo.upsertChefSettings(merged);
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel catch-all route: /api/data/[[...resource]] matches /api/data/:resource/:id
  const resourcePath = (req.query.resource as string[] | undefined) ?? [];
  const resource = resourcePath[0] as ResourceType | undefined;
  const id = resourcePath[1];
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;

  if (!resource || !handlers[resource]) {
    return res.status(400).json({ error: `Invalid resource: ${resource}` });
  }

  const handler = handlers[resource];

  try {
    // GET /api/data/:resource/:id
    if (id && req.method === 'GET') {
      const item = await handler.getById(id);
      if (!item) return res.status(404).json({ error: `${resource} not found` });
      return res.status(200).json(item);
    }

    // GET /api/data/chef-settings?id=default (special case)
    if (req.method === 'GET' && resource === 'chef-settings' && !id) {
      const settingsId = (typeof req.query.id === 'string' ? req.query.id : undefined) ?? 'default';
      const item = await handler.getById(settingsId);
      if (!item) return res.status(404).json({ error: `${resource} not found` });
      return res.status(200).json(item);
    }

    // GET /api/data/:resource?date=...
    if (req.method === 'GET' && date && handler.getByDate) {
      const item = await handler.getByDate(date);
      if (!item) return res.status(404).json({ error: `${resource} not found` });
      return res.status(200).json(item);
    }

    // GET /api/data/:resource (list or getCurrent)
    if (req.method === 'GET') {
      if (handler.getCurrent && resource === 'menus') {
        const item = await handler.getCurrent();
        if (!item) return res.status(404).json({ error: `${resource} not found` });
        return res.status(200).json(item);
      }
      if (handler.list) {
        // Special handling for recipes with filters
        if (resource === 'recipes') {
          const category = typeof req.query.category === 'string' ? req.query.category : undefined;
          const tagsParam = typeof req.query.tags === 'string' ? req.query.tags : undefined;
          const tags = tagsParam ? tagsParam.split(',') : undefined;
          const items = await recipeRepo.getRecipes({ category, tags });
          return res.status(200).json(items);
        }
        const items = await handler.list();
        return res.status(200).json(items);
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // POST /api/data/:resource
    if (req.method === 'POST' && !id) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await handler.create(body);
      return res.status(201).json(item);
    }

    // PUT /api/data/:resource/:id
    if (req.method === 'PUT' && id) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await handler.update(id, body);
      if (!item) return res.status(404).json({ error: `${resource} not found` });
      return res.status(200).json(item);
    }

    // PUT /api/data/:resource (for chef-settings upsert)
    if (req.method === 'PUT' && !id && resource === 'chef-settings') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await handler.create(body);
      return res.status(200).json(item);
    }

    // DELETE /api/data/:resource/:id
    if (req.method === 'DELETE' && id && handler.delete) {
      await handler.delete(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`[api/data/${resource}${id ? `/${id}` : ''}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

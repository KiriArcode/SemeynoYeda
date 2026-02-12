/**
 * Unified REST endpoint for all resources.
 * Routes: /api/data/:resource and /api/data/:resource/:id
 * Replaces multiple separate endpoints to stay within Vercel Hobby limit (12 functions).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as recipeRepo from '../_lib/repositories/recipeRepo.js';
import * as menuRepo from '../_lib/repositories/menuRepo.js';
import * as freezerRepo from '../_lib/repositories/freezerRepo.js';
import * as cookingSessionRepo from '../_lib/repositories/cookingSessionRepo.js';
import * as chefSettingsRepo from '../_lib/repositories/chefSettingsRepo.js';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  CookingSession,
  ChefModeSettings,
} from '../../src/data/schema.js';

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
  // Ensure we always send a response, even if something goes wrong
  let responseSent = false;

  const sendResponse = (status: number, body: unknown) => {
    if (responseSent) {
      console.warn('[api/data] Attempted to send response twice');
      return;
    }
    responseSent = true;
    return res.status(status).json(body);
  };

  const sendError = (status: number, error: unknown) => {
    if (responseSent) {
      console.warn('[api/data] Attempted to send error response after response already sent');
      return;
    }
    responseSent = true;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log details for Vercel Runtime Logs
    console.error('[api/data] Error:', {
      message: errorMessage,
      stack: errorStack,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });

    // Determine error type
    const isDatabaseError =
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('neon') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('timeout');

    if (isDatabaseError) {
      return res.status(status).json({
        error: 'Database connection error',
        message: 'Please check DATABASE_URL environment variable in Vercel settings',
        code: 'DATABASE_ERROR',
      });
    }

    return res.status(status).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred',
      code: 'INTERNAL_ERROR',
    });
  };

  try {
    // Early DATABASE_URL check for clearer error messages
    if (!process.env.DATABASE_URL) {
      console.error('[api/data] DATABASE_URL is not set');
      console.error('[api/data] Available env vars:', Object.keys(process.env).sort());
      return sendResponse(500, {
        error: 'Database configuration error',
        message:
          'DATABASE_URL environment variable is not set. Please configure it in Vercel Settings → Environment Variables.',
        code: 'MISSING_DATABASE_URL',
      });
    }

    // Vercel catch-all route: /api/data/[[...resource]] matches /api/data/:resource/:id
    // Always parse from URL for reliability - Vercel's query.resource can be inconsistent
    let resourcePath: string[] = [];
    if (req.url) {
      const urlPath = req.url.split('?')[0]; // Remove query string
      const pathParts = urlPath.replace(/^\/api\/data\//, '').split('/').filter(Boolean);
      resourcePath = pathParts;
    }
    
    // Fallback to query.resource only if URL parsing failed
    if (resourcePath.length === 0) {
      if (Array.isArray(req.query.resource)) {
        resourcePath = req.query.resource;
      } else if (typeof req.query.resource === 'string') {
        resourcePath = [req.query.resource];
      }
    }
    
    const resource = resourcePath[0] as ResourceType | undefined;
    const id = resourcePath[1];
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    // Log for debugging
    console.log('[api/data] Request details:', {
      method: req.method,
      url: req.url,
      resourcePath,
      resource,
      id,
      query: req.query,
      parsedFromUrl: resourcePath.length > 0 && (!req.query.resource || (Array.isArray(req.query.resource) && req.query.resource.length === 0)),
    });

    if (!resource || !handlers[resource]) {
      console.error('[api/data] Invalid resource:', {
        resource,
        availableResources: Object.keys(handlers),
        resourcePath,
        query: req.query,
      });
      return sendResponse(400, { 
        error: `Invalid resource: ${resource || 'undefined'}`,
        availableResources: Object.keys(handlers),
      });
    }

    const handler = handlers[resource];

    // GET /api/data/:resource/:id
    if (id && req.method === 'GET') {
      console.log(`[api/data] GET by ID: resource=${resource}, id=${id}`);
      try {
        const item = await handler.getById(id);
        if (!item) {
          console.log(`[api/data] ${resource} with id="${id}" not found in database`);
          return sendResponse(404, { error: `${resource} not found`, id });
        }
        console.log(`[api/data] Found ${resource} with id="${id}"`);
        return sendResponse(200, item);
      } catch (error) {
        console.error(`[api/data] Error fetching ${resource} by id="${id}":`, error);
        throw error;
      }
    }

    // GET /api/data/chef-settings?id=default (special case)
    if (req.method === 'GET' && resource === 'chef-settings' && !id) {
      const settingsId =
        (typeof req.query.id === 'string' ? req.query.id : undefined) ?? 'default';
      const item = await handler.getById(settingsId);
      if (!item) return sendResponse(404, { error: `${resource} not found` });
      return sendResponse(200, item);
    }

    // GET /api/data/:resource?date=...
    if (req.method === 'GET' && date && handler.getByDate) {
      const item = await handler.getByDate(date);
      if (!item) return sendResponse(404, { error: `${resource} not found` });
      return sendResponse(200, item);
    }

    // GET /api/data/:resource (list or getCurrent)
    if (req.method === 'GET') {
      if (handler.getCurrent && resource === 'menus') {
        const item = await handler.getCurrent();
        if (!item) return sendResponse(404, { error: `${resource} not found` });
        return sendResponse(200, item);
      }
      if (handler.list) {
        // Special handling for recipes with filters
        if (resource === 'recipes') {
          const category =
            typeof req.query.category === 'string' ? req.query.category : undefined;
          const tagsParam = typeof req.query.tags === 'string' ? req.query.tags : undefined;
          const tags = tagsParam ? tagsParam.split(',') : undefined;
          const items = await recipeRepo.getRecipes({ category, tags });
          return sendResponse(200, items);
        }
        const items = await handler.list();
        return sendResponse(200, items);
      }
      return sendResponse(405, { error: 'Method not allowed' });
    }

    // POST /api/data/:resource
    if (req.method === 'POST' && !id) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      try {
        const item = await handler.create(body);
        return sendResponse(201, item);
      } catch (error) {
        // Check if it's a duplicate error (recipe already in Neon under same title/slug, possibly different id)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          const existingIdMatch = errorMessage.match(/\(id:\s*([^)]+)\)/);
          const existingId = existingIdMatch ? existingIdMatch[1].trim() : undefined;
          return sendResponse(409, {
            error: 'Duplicate recipe',
            message: errorMessage,
            code: 'DUPLICATE_RECIPE',
            ...(existingId && { existingId }),
          });
        }
        throw error;
      }
    }

    // PUT /api/data/:resource/:id
    if (req.method === 'PUT' && id) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await handler.update(id, body);
      if (!item) return sendResponse(404, { error: `${resource} not found` });
      return sendResponse(200, item);
    }

    // PUT /api/data/:resource (for chef-settings upsert)
    if (req.method === 'PUT' && !id && resource === 'chef-settings') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const item = await handler.create(body);
      return sendResponse(200, item);
    }

    // DELETE /api/data/:resource/:id
    if (req.method === 'DELETE' && id && handler.delete) {
      await handler.delete(id);
      if (responseSent) return;
      responseSent = true;
      return res.status(204).end();
    }

    return sendResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    // If response was already sent, just log the error
    if (responseSent) {
      console.error('[api/data] Error occurred after response was sent:', error);
      return;
    }
    return sendError(500, error);
  }
}

/**
 * Data Service с поддержкой синхронизации IndexedDB ↔ Neon.
 * Без VITE_API_URL работает только с IndexedDB (офлайн/статичный деплой).
 *
 * Паттерн: чтение из IndexedDB (быстро), фоновая sync с Neon.
 * Запись: optimistic в IndexedDB → push в Neon (через syncService).
 */

const hasApi =
  typeof import.meta.env.VITE_API_URL === 'string' &&
  import.meta.env.VITE_API_URL.length > 0;

import type { Table } from 'dexie';
import { logger } from './logger';
import { db } from './db';
import { apiDataService } from './dataServiceApi';
import { syncService } from './syncService';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  ShoppingItem,
  PrepPlan,
  CookingSession,
  ChefModeSettings,
  SyncMetadata,
} from '../data/schema';

// ─── Helpers ───────────────────────────────────────────────

/** Тип строки в IndexedDB с метаданными синхронизации */
type WithSync<T> = T & { _sync?: SyncMetadata };

function stripSync<T>(row: WithSync<T>): T {
  const { _sync, ...rest } = row as Record<string, unknown>;
  void _sync;
  return rest as T;
}

function stripSyncArray<T>(rows: WithSync<T>[]): T[] {
  return rows.map(stripSync);
}

function pendingSync(now: string, retryCount = 0): SyncMetadata {
  return { syncStatus: 'pending', localUpdatedAt: now, retryCount };
}

function syncedMeta(now: string, localDate: string): SyncMetadata {
  return { syncStatus: 'synced', lastSyncedAt: now, localUpdatedAt: localDate };
}

/** Запустить фоновый sync, если есть API и сеть */
function triggerSync(): void {
  if (hasApi && navigator.onLine) {
    syncService.syncAll().catch(logger.error);
  }
}

// ─── Generic CRUD builder ──────────────────────────────────

interface ApiCrud<T> {
  list?: (() => Promise<T[]>) | undefined;
  get?: ((id: string) => Promise<T>) | undefined;
  delete?: ((id: string) => Promise<void>) | undefined;
}

/**
 * Создаёт стандартный набор CRUD-операций для entity с полем `id`.
 * Чтение — из IndexedDB, запись — optimistic + background sync.
 */
function buildCrud<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any, string>,
  api: ApiCrud<T>,
  name: string,
  /** Поле-дата для localUpdatedAt при кэшировании ответа Neon */
  dateField?: string,
) {
  return {
    list: async (): Promise<T[]> => {
      try {
        const rows: WithSync<T>[] = await table.toArray();
        triggerSync();
        return stripSyncArray(rows);
      } catch (error) {
        logger.error(`[dataService.${name}.list]`, error);
        if (hasApi && navigator.onLine && api.list) return api.list();
        return [];
      }
    },

    get: async (id: string): Promise<T | null> => {
      try {
        const cached: WithSync<T> | undefined = await table.get(id);
        if (cached) return stripSync(cached);

        if (hasApi && navigator.onLine && api.get) {
          const item = await api.get(id);
          if (item) {
            const now = new Date().toISOString();
            const localDate = dateField
              ? String((item as Record<string, unknown>)[dateField] ?? now)
              : now;
            await table.put({ ...item, _sync: syncedMeta(now, localDate) });
          }
          return item ?? null;
        }
        return null;
      } catch (error) {
        logger.error(`[dataService.${name}.get]`, error);
        if (hasApi && navigator.onLine && api.get) return api.get(id);
        return null;
      }
    },

    create: async (item: T): Promise<T> => {
      const now = new Date().toISOString();
      const row: WithSync<T> = { ...item, _sync: pendingSync(now) };
      try {
        await table.put(row);
        triggerSync();
        return stripSync(row);
      } catch (error) {
        logger.error(`[dataService.${name}.create]`, error);
        throw error;
      }
    },

    update: async (id: string, partial: Partial<T>): Promise<T> => {
      try {
        const existing: WithSync<T> | undefined = await table.get(id);
        if (!existing) throw new Error(`${name} ${id} not found`);

        const now = new Date().toISOString();
        const updated: WithSync<T> = {
          ...existing,
          ...partial,
          id,
          _sync: pendingSync(now, existing._sync?.retryCount || 0),
        } as WithSync<T>;

        await table.put(updated);
        triggerSync();
        return stripSync(updated);
      } catch (error) {
        logger.error(`[dataService.${name}.update]`, error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await table.delete(id);
        if (hasApi && navigator.onLine && api.delete) {
          api.delete(id).catch((e) =>
            logger.error(`[dataService.${name}.delete] Neon:`, e),
          );
        }
      } catch (error) {
        logger.error(`[dataService.${name}.delete]`, error);
        throw error;
      }
    },
  };
}

// ─── Entity-specific CRUD instances ────────────────────────

const recipesCrud = buildCrud<Recipe>(db.recipes, apiDataService.recipes, 'recipes', 'updatedAt');
const menusCrud = buildCrud<WeekMenu>(db.menus, apiDataService.menus, 'menus', 'createdAt');
const freezerCrud = buildCrud<FreezerItem>(db.freezer, apiDataService.freezer, 'freezer', 'frozenDate');
const prepPlansCrud = buildCrud<PrepPlan>(db.prepPlans, apiDataService.prepPlans, 'prepPlans', 'date');
const cookingSessionsCrud = buildCrud<CookingSession>(db.cookingSessions, apiDataService.cookingSessions, 'cookingSessions', 'date');

// ─── Exported service ──────────────────────────────────────

export const dataServiceWithSync = {
  recipes: {
    ...recipesCrud,
    /** Список с фильтрацией по категории и тегам */
    list: async (filters?: { category?: string; tags?: string[] }): Promise<Recipe[]> => {
      try {
        let rows: WithSync<Recipe>[] = await db.recipes.toArray();

        if (filters?.category) {
          rows = rows.filter((r) => r.category === filters.category);
        }
        if (filters?.tags?.length) {
          rows = rows.filter((r) =>
            filters.tags!.some((tag) => (r.tags as string[]).includes(tag)),
          );
        }

        triggerSync();
        return stripSyncArray(rows);
      } catch (error) {
        logger.error('[dataService.recipes.list]', error);
        if (hasApi && navigator.onLine) return apiDataService.recipes.list(filters);
        return [];
      }
    },
  },

  menus: {
    ...menusCrud,
    /** Получить последнее (текущее) меню */
    getCurrent: async (): Promise<WeekMenu | null> => {
      try {
        const cached: WithSync<WeekMenu> | undefined = await db.menus.orderBy('createdAt').last();
        if (cached) {
          triggerSync();
          return stripSync(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.menus.getCurrent();
          if (item) {
            const now = new Date().toISOString();
            await db.menus.put({ ...item, _sync: syncedMeta(now, item.createdAt) });
          }
          return item;
        }
        return null;
      } catch (error) {
        logger.error('[dataService.menus.getCurrent]', error);
        if (hasApi && navigator.onLine) return apiDataService.menus.getCurrent();
        return null;
      }
    },
  },

  freezer: freezerCrud,

  shopping: {
    list: async (): Promise<ShoppingItem[]> => {
      try {
        const rows: WithSync<ShoppingItem>[] = await db.shoppingById.toArray();
        triggerSync();
        return stripSyncArray(rows);
      } catch (error) {
        logger.error('[dataService.shopping.list]', error);
        if (hasApi && navigator.onLine) return apiDataService.shopping.list();
        return [];
      }
    },

    get: async (id: string): Promise<ShoppingItem | null> => {
      try {
        const row: WithSync<ShoppingItem> | undefined = await db.shoppingById.get(id);
        if (!row) return null;
        triggerSync();
        return stripSync(row);
      } catch (error) {
        logger.error('[dataService.shopping.get]', error);
        return null;
      }
    },

    create: async (item: ShoppingItem): Promise<ShoppingItem> => {
      const now = new Date().toISOString();
      const withId = { ...item, id: item.id || crypto.randomUUID() };
      const row: WithSync<ShoppingItem> = { ...withId, _sync: pendingSync(now) };
      try {
        await db.shoppingById.put(row);
        triggerSync();
        return stripSync(row);
      } catch (error) {
        logger.error('[dataService.shopping.create]', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> => {
      try {
        const existing: WithSync<ShoppingItem> | undefined = await db.shoppingById.get(id);
        if (!existing) throw new Error(`ShoppingItem ${id} not found`);

        const now = new Date().toISOString();
        const updated: WithSync<ShoppingItem> = {
          ...existing,
          ...updates,
          id,
          _sync: pendingSync(now, existing._sync?.retryCount || 0),
        } as WithSync<ShoppingItem>;

        await db.shoppingById.put(updated);
        triggerSync();
        return stripSync(updated);
      } catch (error) {
        logger.error('[dataService.shopping.update]', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.shoppingById.delete(id);
        if (hasApi && navigator.onLine) {
          apiDataService.shopping.delete(id).catch((e) =>
            logger.error('[dataService.shopping.delete] Neon:', e),
          );
        }
      } catch (error) {
        logger.error('[dataService.shopping.delete]', error);
        throw error;
      }
    },

    bulkPut: async (items: ShoppingItem[]): Promise<ShoppingItem[]> => {
      const now = new Date().toISOString();
      const rows: WithSync<ShoppingItem>[] = items.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        _sync: pendingSync(now),
      }));

      try {
        await db.shoppingById.bulkPut(rows);
        triggerSync();
        return stripSyncArray(rows);
      } catch (error) {
        logger.error('[dataService.shopping.bulkPut]', error);
        throw error;
      }
    },
  },

  prepPlans: {
    ...prepPlansCrud,
    /** Получить план по дате */
    getByDate: async (date: string): Promise<PrepPlan | null> => {
      try {
        const cached: WithSync<PrepPlan> | undefined = await db.prepPlans
          .where('date')
          .equals(date)
          .first();
        if (cached) return stripSync(cached);

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.prepPlans.getByDate(date);
          if (item) {
            const now = new Date().toISOString();
            await db.prepPlans.put({ ...item, _sync: syncedMeta(now, item.date) });
          }
          return item ?? null;
        }
        return null;
      } catch (error) {
        logger.error('[dataService.prepPlans.getByDate]', error);
        if (hasApi && navigator.onLine) return apiDataService.prepPlans.getByDate(date);
        return null;
      }
    },
  },

  cookingSessions: {
    ...cookingSessionsCrud,
    /** Получить сессию по дате */
    getByDate: async (date: string): Promise<CookingSession | null> => {
      try {
        const cached: WithSync<CookingSession> | undefined = await db.cookingSessions
          .where('date')
          .equals(date)
          .first();
        if (cached) return stripSync(cached);

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.cookingSessions.getByDate(date);
          if (item) {
            const now = new Date().toISOString();
            await db.cookingSessions.put({ ...item, _sync: syncedMeta(now, item.date) });
          }
          return item ?? null;
        }
        return null;
      } catch (error) {
        logger.error('[dataService.cookingSessions.getByDate]', error);
        if (hasApi && navigator.onLine) return apiDataService.cookingSessions.getByDate(date);
        return null;
      }
    },
  },

  chefSettings: {
    get: async (id = 'default'): Promise<ChefModeSettings | null> => {
      try {
        const cached: WithSync<ChefModeSettings> | undefined = await db.chefSettings.get(id);
        if (cached) return stripSync(cached);

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.chefSettings.get(id);
          if (item) {
            const now = new Date().toISOString();
            await db.chefSettings.put({ ...item, _sync: syncedMeta(now, now) });
          }
          return item ?? null;
        }
        return null;
      } catch (error) {
        logger.error('[dataService.chefSettings.get]', error);
        if (hasApi && navigator.onLine) return apiDataService.chefSettings.get(id);
        return null;
      }
    },

    save: async (settings: ChefModeSettings): Promise<ChefModeSettings> => {
      const now = new Date().toISOString();
      const row: WithSync<ChefModeSettings> = { ...settings, _sync: pendingSync(now) };
      try {
        await db.chefSettings.put(row);
        triggerSync();
        return stripSync(row);
      } catch (error) {
        logger.error('[dataService.chefSettings.save]', error);
        throw error;
      }
    },
  },
};

/**
 * Data Service с поддержкой синхронизации IndexedDB ↔ Neon
 * Без VITE_API_URL работает только с IndexedDB (офлайн/статичный деплой, напр. Vercel).
 */

const hasApi = typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.length > 0;

import { logger } from './logger';
import { db } from './db';
import { apiDataService } from './dataServiceApi';
import { syncService, type SyncableItem } from './syncService';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  ShoppingItem,
  PrepPlan,
  CookingSession,
  ChefModeSettings,
} from '../data/schema';

/**
 * Убирает метаданные синхронизации перед возвратом
 */
function removeSyncMetadata<T>(item: SyncableItem): T {
  const { _sync, ...itemWithoutSync } = item;
  return itemWithoutSync as T;
}

function removeSyncMetadataArray<T>(items: SyncableItem[]): T[] {
  return items.map(removeSyncMetadata<T>);
}

export const dataServiceWithSync = {
  recipes: {
    list: async (filters?: { category?: string; tags?: string[] }): Promise<Recipe[]> => {
      try {
        // Сначала возвращаем из IndexedDB (быстрый ответ)
        let cached = (await db.recipes.toArray()) as SyncableItem[];

        // Применяем фильтры
        if (filters?.category) {
          cached = cached.filter((r) => (r as Recipe).category === filters.category);
        }
        if (filters?.tags?.length) {
          cached = cached.filter((r) =>
            filters.tags!.some((tag) => (r as Recipe).tags.includes(tag as any))
          );
        }

        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }

        // Убираем метаданные синхронизации перед возвратом
        return removeSyncMetadataArray<Recipe>(cached);
      } catch (error) {
        logger.error('[dataServiceWithSync.recipes.list] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.recipes.list(filters);
        }
        return [];
      }
    },

    get: async (id: string): Promise<Recipe | null> => {
      try {
        // Сначала проверяем IndexedDB
        const cached = (await db.recipes.get(id as any)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<Recipe>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.recipes.get(id);
          if (item) {
            // Сохраняем в IndexedDB
            const now = new Date().toISOString();
            await db.recipes.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.updatedAt,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.recipes.get] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.recipes.get(id);
        }
        return null;
      }
    },

    create: async (recipe: Recipe): Promise<Recipe> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...recipe,
        createdAt: recipe.createdAt || now,
        updatedAt: now,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        // Optimistic: сразу сохраняем в IndexedDB
        await db.recipes.put(itemWithSync as any);

        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }

        return removeSyncMetadata<Recipe>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.recipes.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
      try {
        // Получаем текущую версию из IndexedDB
        const existing = (await db.recipes.get(id as any)) as SyncableItem | undefined;
        if (!existing) {
          throw new Error(`Recipe ${id} not found`);
        }

        const now = new Date().toISOString();
        const updated: SyncableItem = {
          ...existing,
          ...recipe,
          id,
          updatedAt: now,
          _sync: {
            syncStatus: 'pending',
            localUpdatedAt: now,
            retryCount: existing._sync?.retryCount || 0,
          },
        } as SyncableItem;

        // Optimistic: сразу сохраняем в IndexedDB
        await db.recipes.put(updated as any);

        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }

        return removeSyncMetadata<Recipe>(updated);
      } catch (error) {
        logger.error('[dataServiceWithSync.recipes.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        // Optimistic: удаляем из IndexedDB
        await db.recipes.delete(id as any);

        if (hasApi && navigator.onLine) {
          try {
            await apiDataService.recipes.delete(id);
          } catch (error) {
            logger.error('[dataServiceWithSync.recipes.delete] Ошибка удаления в Neon:', error);
            // Можно добавить в очередь удалений для повторной попытки
          }
        }
      } catch (error) {
        logger.error('[dataServiceWithSync.recipes.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  menus: {
    getCurrent: async (): Promise<WeekMenu | null> => {
      try {
        // Проверяем IndexedDB
        const cached = (await db.menus.orderBy('createdAt').last()) as SyncableItem | undefined;
        if (cached) {
          // В фоне синхронизируем
          if (hasApi && navigator.onLine) {
            syncService.syncAll().catch(logger.error);
          }
          return removeSyncMetadata<WeekMenu>(cached);
        }

        // Если нет в кэше, загружаем из Neon
        if (hasApi && navigator.onLine) {
          const item = await apiDataService.menus.getCurrent();
          if (item) {
            const now = new Date().toISOString();
            await db.menus.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.createdAt,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.menus.getCurrent] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.menus.getCurrent();
        }
        return null;
      }
    },

    get: async (id: string): Promise<WeekMenu | null> => {
      try {
        const cached = (await db.menus.get(id as any)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<WeekMenu>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.menus.get(id);
          if (item) {
            const now = new Date().toISOString();
            await db.menus.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.createdAt,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.menus.get] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.menus.get(id);
        }
        return null;
      }
    },

    create: async (menu: WeekMenu): Promise<WeekMenu> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...menu,
        createdAt: menu.createdAt || now,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        await db.menus.put(itemWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<WeekMenu>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.menus.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, menu: Partial<WeekMenu>): Promise<WeekMenu> => {
      try {
        const existing = (await db.menus.get(id as any)) as SyncableItem | undefined;
        if (!existing) {
          throw new Error(`Menu ${id} not found`);
        }

        const now = new Date().toISOString();
        const updated: SyncableItem = {
          ...existing,
          ...menu,
          id,
          _sync: {
            syncStatus: 'pending',
            localUpdatedAt: now,
            retryCount: existing._sync?.retryCount || 0,
          },
        } as SyncableItem;

        await db.menus.put(updated as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<WeekMenu>(updated);
      } catch (error) {
        logger.error('[dataServiceWithSync.menus.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.menus.delete(id as any);
        if (hasApi && navigator.onLine) {
          try {
            await apiDataService.menus.delete(id);
          } catch (error) {
            logger.error('[dataServiceWithSync.menus.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        logger.error('[dataServiceWithSync.menus.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  freezer: {
    list: async (): Promise<FreezerItem[]> => {
      try {
        const cached = (await db.freezer.toArray()) as SyncableItem[];
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadataArray<FreezerItem>(cached);
      } catch (error) {
        logger.error('[dataServiceWithSync.freezer.list] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.freezer.list();
        }
        return [];
      }
    },

    get: async (id: string): Promise<FreezerItem | null> => {
      try {
        const cached = (await db.freezer.get(id as any)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<FreezerItem>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.freezer.get(id);
          if (item) {
            const now = new Date().toISOString();
            await db.freezer.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.frozenDate,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.freezer.get] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.freezer.get(id);
        }
        return null;
      }
    },

    create: async (item: FreezerItem): Promise<FreezerItem> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...item,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        await db.freezer.put(itemWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<FreezerItem>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.freezer.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, item: Partial<FreezerItem>): Promise<FreezerItem> => {
      try {
        const existing = (await db.freezer.get(id as any)) as SyncableItem | undefined;
        if (!existing) {
          throw new Error(`FreezerItem ${id} not found`);
        }

        const now = new Date().toISOString();
        const updated: SyncableItem = {
          ...existing,
          ...item,
          id,
          _sync: {
            syncStatus: 'pending',
            localUpdatedAt: now,
            retryCount: existing._sync?.retryCount || 0,
          },
        } as SyncableItem;

        await db.freezer.put(updated as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<FreezerItem>(updated);
      } catch (error) {
        logger.error('[dataServiceWithSync.freezer.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.freezer.delete(id as any);
        if (hasApi && navigator.onLine) {
          try {
            await apiDataService.freezer.delete(id);
          } catch (error) {
            logger.error('[dataServiceWithSync.freezer.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        logger.error('[dataServiceWithSync.freezer.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  shopping: {
    list: async (): Promise<ShoppingItem[]> => {
      try {
        const cached = (await db.shopping.toArray()) as SyncableItem[];
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadataArray<ShoppingItem>(cached);
      } catch (error) {
        logger.error('[dataServiceWithSync.shopping.list] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.shopping.list();
        }
        return [];
      }
    },

    bulkPut: async (items: ShoppingItem[]): Promise<ShoppingItem[]> => {
      const now = new Date().toISOString();
      const itemsWithSync: SyncableItem[] = items.map((item) => ({
        ...item,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem));

      try {
        await db.shopping.bulkPut(itemsWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadataArray<ShoppingItem>(itemsWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.shopping.bulkPut] Ошибка:', error);
        throw error;
      }
    },

    create: async (item: ShoppingItem): Promise<ShoppingItem> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...item,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        await db.shopping.put(itemWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<ShoppingItem>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.shopping.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (ingredient: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> => {
      try {
        const existing = (await db.shopping.get(ingredient as any)) as SyncableItem | undefined;
        if (!existing) {
          throw new Error(`ShoppingItem ${ingredient} not found`);
        }

        const now = new Date().toISOString();
        const updated: SyncableItem = {
          ...existing,
          ...updates,
          ingredient,
          _sync: {
            syncStatus: 'pending',
            localUpdatedAt: now,
            retryCount: existing._sync?.retryCount || 0,
          },
        } as SyncableItem;

        await db.shopping.put(updated as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<ShoppingItem>(updated);
      } catch (error) {
        logger.error('[dataServiceWithSync.shopping.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (ingredient: string): Promise<void> => {
      try {
        await db.shopping.delete(ingredient as any);
        if (hasApi && navigator.onLine) {
          try {
            await apiDataService.shopping.delete(ingredient);
          } catch (error) {
            logger.error('[dataServiceWithSync.shopping.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        logger.error('[dataServiceWithSync.shopping.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  prepPlans: {
    list: async (): Promise<PrepPlan[]> => {
      try {
        const cached = (await db.prepPlans.toArray()) as SyncableItem[];
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadataArray<PrepPlan>(cached);
      } catch (error) {
        logger.error('[dataServiceWithSync.prepPlans.list] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.prepPlans.list();
        }
        return [];
      }
    },

    getByDate: async (date: string): Promise<PrepPlan | null> => {
      try {
        const cached = (await db.prepPlans.where('date').equals(date).first()) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<PrepPlan>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.prepPlans.getByDate(date);
          if (item) {
            const now = new Date().toISOString();
            await db.prepPlans.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.date,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.prepPlans.getByDate] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.prepPlans.getByDate(date);
        }
        return null;
      }
    },

    get: async (id: string): Promise<PrepPlan | null> => {
      try {
        const cached = (await db.prepPlans.get(id as any)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<PrepPlan>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.prepPlans.get(id);
          if (item) {
            const now = new Date().toISOString();
            await db.prepPlans.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.date,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.prepPlans.get] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.prepPlans.get(id);
        }
        return null;
      }
    },

    create: async (plan: PrepPlan): Promise<PrepPlan> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...plan,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        await db.prepPlans.put(itemWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<PrepPlan>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.prepPlans.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, plan: Partial<PrepPlan>): Promise<PrepPlan> => {
      try {
        const existing = (await db.prepPlans.get(id as any)) as SyncableItem | undefined;
        if (!existing) {
          throw new Error(`PrepPlan ${id} not found`);
        }

        const now = new Date().toISOString();
        const updated: SyncableItem = {
          ...existing,
          ...plan,
          id,
          _sync: {
            syncStatus: 'pending',
            localUpdatedAt: now,
            retryCount: existing._sync?.retryCount || 0,
          },
        } as SyncableItem;

        await db.prepPlans.put(updated as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<PrepPlan>(updated);
      } catch (error) {
        logger.error('[dataServiceWithSync.prepPlans.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.prepPlans.delete(id as any);
        if (hasApi && navigator.onLine) {
          try {
            await apiDataService.prepPlans.delete(id);
          } catch (error) {
            logger.error('[dataServiceWithSync.prepPlans.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        logger.error('[dataServiceWithSync.prepPlans.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  cookingSessions: {
    list: async (): Promise<CookingSession[]> => {
      try {
        const cached = (await db.cookingSessions.toArray()) as SyncableItem[];
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadataArray<CookingSession>(cached);
      } catch (error) {
        logger.error('[dataServiceWithSync.cookingSessions.list] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.cookingSessions.list();
        }
        return [];
      }
    },

    getByDate: async (date: string): Promise<CookingSession | null> => {
      try {
        const cached = (await db.cookingSessions.where('date').equals(date).first()) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<CookingSession>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.cookingSessions.getByDate(date);
          if (item) {
            const now = new Date().toISOString();
            await db.cookingSessions.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.date,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.cookingSessions.getByDate] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.cookingSessions.getByDate(date);
        }
        return null;
      }
    },

    get: async (id: string): Promise<CookingSession | null> => {
      try {
        const cached = (await db.cookingSessions.get(id as any)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<CookingSession>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.cookingSessions.get(id);
          if (item) {
            const now = new Date().toISOString();
            await db.cookingSessions.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: item.date,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.cookingSessions.get] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.cookingSessions.get(id);
        }
        return null;
      }
    },

    create: async (session: CookingSession): Promise<CookingSession> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...session,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        await db.cookingSessions.put(itemWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<CookingSession>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.cookingSessions.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, session: Partial<CookingSession>): Promise<CookingSession> => {
      try {
        const existing = (await db.cookingSessions.get(id as any)) as SyncableItem | undefined;
        if (!existing) {
          throw new Error(`CookingSession ${id} not found`);
        }

        const now = new Date().toISOString();
        const updated: SyncableItem = {
          ...existing,
          ...session,
          id,
          _sync: {
            syncStatus: 'pending',
            localUpdatedAt: now,
            retryCount: existing._sync?.retryCount || 0,
          },
        } as SyncableItem;

        await db.cookingSessions.put(updated as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<CookingSession>(updated);
      } catch (error) {
        logger.error('[dataServiceWithSync.cookingSessions.update] Ошибка:', error);
        throw error;
      }
    },
  },

  chefSettings: {
    get: async (id = 'default'): Promise<ChefModeSettings | null> => {
      try {
        const cached = (await db.chefSettings.get(id as any)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<ChefModeSettings>(cached);
        }

        if (hasApi && navigator.onLine) {
          const item = await apiDataService.chefSettings.get(id);
          if (item) {
            const now = new Date().toISOString();
            await db.chefSettings.put({
              ...item,
              _sync: {
                syncStatus: 'synced',
                lastSyncedAt: now,
                localUpdatedAt: now,
              },
            } as any);
          }
          return item;
        }

        return null;
      } catch (error) {
        logger.error('[dataServiceWithSync.chefSettings.get] Ошибка:', error);
        if (hasApi && navigator.onLine) {
          return await apiDataService.chefSettings.get(id);
        }
        return null;
      }
    },

    save: async (settings: ChefModeSettings): Promise<ChefModeSettings> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...settings,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      } as SyncableItem;

      try {
        await db.chefSettings.put(itemWithSync as any);
        if (hasApi && navigator.onLine) {
          syncService.syncAll().catch(logger.error);
        }
        return removeSyncMetadata<ChefModeSettings>(itemWithSync);
      } catch (error) {
        logger.error('[dataServiceWithSync.chefSettings.save] Ошибка:', error);
        throw error;
      }
    },
  },
};

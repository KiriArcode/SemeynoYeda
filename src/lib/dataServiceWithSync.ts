/**
 * Data Service с поддержкой синхронизации IndexedDB ↔ Neon
 * 
 * Использование:
 * - Заменяет прямой вызов dataService
 * - Автоматически работает с IndexedDB как кэшем
 * - Синхронизирует изменения в фоне
 */

import { db } from './db';
import { dataService } from './dataService';
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

        // В фоне синхронизируем с Neon (не блокируем ответ)
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }

        // Убираем метаданные синхронизации перед возвратом
        return removeSyncMetadataArray<Recipe>(cached);
      } catch (error) {
        console.error('[dataServiceWithSync.recipes.list] Ошибка:', error);
        // Fallback на прямой вызов API если IndexedDB недоступен
        if (navigator.onLine) {
          return await dataService.recipes.list(filters);
        }
        return [];
      }
    },

    get: async (id: string): Promise<Recipe | null> => {
      try {
        // Сначала проверяем IndexedDB
        const cached = (await db.recipes.get(id)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<Recipe>(cached);
        }

        // Если нет в кэше, загружаем из Neon
        if (navigator.onLine) {
          const item = await dataService.recipes.get(id);
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
        console.error('[dataServiceWithSync.recipes.get] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.recipes.get(id);
        }
        return null;
      }
    },

    create: async (recipe: Recipe): Promise<Recipe> => {
      const now = new Date().toISOString();
      const itemWithSync: SyncableItem = {
        ...recipe,
        updatedAt: now,
        createdAt: recipe.createdAt || now,
        _sync: {
          syncStatus: 'pending',
          localUpdatedAt: now,
          retryCount: 0,
        },
      };

      try {
        // Optimistic: сразу сохраняем в IndexedDB
        await db.recipes.put(itemWithSync as any);

        // В фоне синхронизируем с Neon
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }

        return removeSyncMetadata<Recipe>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.recipes.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
      try {
        // Получаем текущую версию из IndexedDB
        const existing = (await db.recipes.get(id)) as SyncableItem | undefined;
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
        };

        // Optimistic: сразу сохраняем в IndexedDB
        await db.recipes.put(updated as any);

        // В фоне синхронизируем с Neon
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }

        return removeSyncMetadata<Recipe>(updated);
      } catch (error) {
        console.error('[dataServiceWithSync.recipes.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        // Optimistic: удаляем из IndexedDB
        await db.recipes.delete(id);

        // В фоне синхронизируем с Neon
        if (navigator.onLine) {
          try {
            await dataService.recipes.delete(id);
          } catch (error) {
            console.error('[dataServiceWithSync.recipes.delete] Ошибка удаления в Neon:', error);
            // Можно добавить в очередь удалений для повторной попытки
          }
        }
      } catch (error) {
        console.error('[dataServiceWithSync.recipes.delete] Ошибка:', error);
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
          if (navigator.onLine) {
            syncService.syncAll().catch(console.error);
          }
          return removeSyncMetadata<WeekMenu>(cached);
        }

        // Если нет в кэше, загружаем из Neon
        if (navigator.onLine) {
          const item = await dataService.menus.getCurrent();
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
        console.error('[dataServiceWithSync.menus.getCurrent] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.menus.getCurrent();
        }
        return null;
      }
    },

    get: async (id: string): Promise<WeekMenu | null> => {
      try {
        const cached = (await db.menus.get(id)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<WeekMenu>(cached);
        }

        if (navigator.onLine) {
          const item = await dataService.menus.get(id);
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
        console.error('[dataServiceWithSync.menus.get] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.menus.get(id);
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
      };

      try {
        await db.menus.put(itemWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<WeekMenu>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.menus.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, menu: Partial<WeekMenu>): Promise<WeekMenu> => {
      try {
        const existing = (await db.menus.get(id)) as SyncableItem | undefined;
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
        };

        await db.menus.put(updated as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<WeekMenu>(updated);
      } catch (error) {
        console.error('[dataServiceWithSync.menus.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.menus.delete(id);
        if (navigator.onLine) {
          try {
            await dataService.menus.delete(id);
          } catch (error) {
            console.error('[dataServiceWithSync.menus.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        console.error('[dataServiceWithSync.menus.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  freezer: {
    list: async (): Promise<FreezerItem[]> => {
      try {
        const cached = (await db.freezer.toArray()) as SyncableItem[];
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadataArray<FreezerItem>(cached);
      } catch (error) {
        console.error('[dataServiceWithSync.freezer.list] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.freezer.list();
        }
        return [];
      }
    },

    get: async (id: string): Promise<FreezerItem | null> => {
      try {
        const cached = (await db.freezer.get(id)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<FreezerItem>(cached);
        }

        if (navigator.onLine) {
          const item = await dataService.freezer.get(id);
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
        console.error('[dataServiceWithSync.freezer.get] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.freezer.get(id);
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
      };

      try {
        await db.freezer.put(itemWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<FreezerItem>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.freezer.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, item: Partial<FreezerItem>): Promise<FreezerItem> => {
      try {
        const existing = (await db.freezer.get(id)) as SyncableItem | undefined;
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
        };

        await db.freezer.put(updated as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<FreezerItem>(updated);
      } catch (error) {
        console.error('[dataServiceWithSync.freezer.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.freezer.delete(id);
        if (navigator.onLine) {
          try {
            await dataService.freezer.delete(id);
          } catch (error) {
            console.error('[dataServiceWithSync.freezer.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        console.error('[dataServiceWithSync.freezer.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  shopping: {
    list: async (): Promise<ShoppingItem[]> => {
      try {
        const cached = (await db.shopping.toArray()) as SyncableItem[];
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadataArray<ShoppingItem>(cached);
      } catch (error) {
        console.error('[dataServiceWithSync.shopping.list] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.shopping.list();
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
      }));

      try {
        await db.shopping.bulkPut(itemsWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadataArray<ShoppingItem>(itemsWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.shopping.bulkPut] Ошибка:', error);
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
      };

      try {
        await db.shopping.put(itemWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<ShoppingItem>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.shopping.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (ingredient: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> => {
      try {
        const existing = (await db.shopping.get(ingredient)) as SyncableItem | undefined;
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
        };

        await db.shopping.put(updated as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<ShoppingItem>(updated);
      } catch (error) {
        console.error('[dataServiceWithSync.shopping.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (ingredient: string): Promise<void> => {
      try {
        await db.shopping.delete(ingredient);
        if (navigator.onLine) {
          try {
            await dataService.shopping.delete(ingredient);
          } catch (error) {
            console.error('[dataServiceWithSync.shopping.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        console.error('[dataServiceWithSync.shopping.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  prepPlans: {
    list: async (): Promise<PrepPlan[]> => {
      try {
        const cached = (await db.prepPlans.toArray()) as SyncableItem[];
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadataArray<PrepPlan>(cached);
      } catch (error) {
        console.error('[dataServiceWithSync.prepPlans.list] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.prepPlans.list();
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

        if (navigator.onLine) {
          const item = await dataService.prepPlans.getByDate(date);
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
        console.error('[dataServiceWithSync.prepPlans.getByDate] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.prepPlans.getByDate(date);
        }
        return null;
      }
    },

    get: async (id: string): Promise<PrepPlan | null> => {
      try {
        const cached = (await db.prepPlans.get(id)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<PrepPlan>(cached);
        }

        if (navigator.onLine) {
          const item = await dataService.prepPlans.get(id);
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
        console.error('[dataServiceWithSync.prepPlans.get] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.prepPlans.get(id);
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
      };

      try {
        await db.prepPlans.put(itemWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<PrepPlan>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.prepPlans.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, plan: Partial<PrepPlan>): Promise<PrepPlan> => {
      try {
        const existing = (await db.prepPlans.get(id)) as SyncableItem | undefined;
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
        };

        await db.prepPlans.put(updated as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<PrepPlan>(updated);
      } catch (error) {
        console.error('[dataServiceWithSync.prepPlans.update] Ошибка:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await db.prepPlans.delete(id);
        if (navigator.onLine) {
          try {
            await dataService.prepPlans.delete(id);
          } catch (error) {
            console.error('[dataServiceWithSync.prepPlans.delete] Ошибка:', error);
          }
        }
      } catch (error) {
        console.error('[dataServiceWithSync.prepPlans.delete] Ошибка:', error);
        throw error;
      }
    },
  },

  cookingSessions: {
    list: async (): Promise<CookingSession[]> => {
      try {
        const cached = (await db.cookingSessions.toArray()) as SyncableItem[];
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadataArray<CookingSession>(cached);
      } catch (error) {
        console.error('[dataServiceWithSync.cookingSessions.list] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.cookingSessions.list();
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

        if (navigator.onLine) {
          const item = await dataService.cookingSessions.getByDate(date);
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
        console.error('[dataServiceWithSync.cookingSessions.getByDate] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.cookingSessions.getByDate(date);
        }
        return null;
      }
    },

    get: async (id: string): Promise<CookingSession | null> => {
      try {
        const cached = (await db.cookingSessions.get(id)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<CookingSession>(cached);
        }

        if (navigator.onLine) {
          const item = await dataService.cookingSessions.get(id);
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
        console.error('[dataServiceWithSync.cookingSessions.get] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.cookingSessions.get(id);
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
      };

      try {
        await db.cookingSessions.put(itemWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<CookingSession>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.cookingSessions.create] Ошибка:', error);
        throw error;
      }
    },

    update: async (id: string, session: Partial<CookingSession>): Promise<CookingSession> => {
      try {
        const existing = (await db.cookingSessions.get(id)) as SyncableItem | undefined;
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
        };

        await db.cookingSessions.put(updated as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<CookingSession>(updated);
      } catch (error) {
        console.error('[dataServiceWithSync.cookingSessions.update] Ошибка:', error);
        throw error;
      }
    },
  },

  chefSettings: {
    get: async (id = 'default'): Promise<ChefModeSettings | null> => {
      try {
        const cached = (await db.chefSettings.get(id)) as SyncableItem | undefined;
        if (cached) {
          return removeSyncMetadata<ChefModeSettings>(cached);
        }

        if (navigator.onLine) {
          const item = await dataService.chefSettings.get(id);
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
        console.error('[dataServiceWithSync.chefSettings.get] Ошибка:', error);
        if (navigator.onLine) {
          return await dataService.chefSettings.get(id);
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
      };

      try {
        await db.chefSettings.put(itemWithSync as any);
        if (navigator.onLine) {
          syncService.syncAll().catch(console.error);
        }
        return removeSyncMetadata<ChefModeSettings>(itemWithSync);
      } catch (error) {
        console.error('[dataServiceWithSync.chefSettings.save] Ошибка:', error);
        throw error;
      }
    },
  },
};

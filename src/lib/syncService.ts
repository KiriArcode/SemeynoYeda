/**
 * Sync Service — синхронизация Neon PostgreSQL ↔ IndexedDB
 * 
 * Стратегия:
 * - Optimistic updates: изменения сразу в IndexedDB
 * - Background sync: синхронизация в фоне
 * - Conflict resolution: last write wins (по updatedAt)
 */

import { db } from './db';
import { apiDataService } from './dataServiceApi';
import { logger } from './logger';
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

// Re-export для обратной совместимости
export type { SyncMetadata };

type SyncableEntity =
  | Recipe
  | WeekMenu
  | FreezerItem
  | ShoppingItem
  | PrepPlan
  | CookingSession
  | ChefModeSettings;

type TableName =
  | 'recipes'
  | 'menus'
  | 'freezer'
  | 'shopping'
  | 'prepPlans'
  | 'cookingSessions'
  | 'chefSettings';

/** Вспомогательный тип: entity с id и опциональными временными метками */
interface EntityWithId {
  id: string;
  updatedAt?: string;
  createdAt?: string;
}

export type SyncableItem = SyncableEntity & {
  _sync?: SyncMetadata;
}

class SyncService {
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: Set<TableName> = new Set();
  private initialized = false;

  /** Store для shopping — shoppingById (keyPath id). Dexie не поддерживает смену keyPath у существующего store. */
  private getTable(tableName: TableName) {
    return tableName === 'shopping' ? db.shoppingById : db.table(tableName);
  }

  constructor() {
    // Слушаем события онлайн/офлайн
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        logger.log('[SyncService] Онлайн — запускаем синхронизацию');
        this.syncAll().catch(logger.error);
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        logger.log('[SyncService] Офлайн — используем только IndexedDB');
      });
    }
  }

  /**
   * Инициализация: загрузка данных из Neon при старте (только если задан VITE_API_URL).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const hasApi = typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.length > 0;
    if (!hasApi) {
      logger.log('[SyncService] API не задан — используем только IndexedDB');
      return;
    }

    if (!this.isOnline) {
      logger.log('[SyncService] Офлайн при старте — используем только IndexedDB');
      return;
    }

    try {
      logger.log('[SyncService] Инициализация синхронизации...');
      
      // Загружаем все данные из Neon и сохраняем в IndexedDB
      await this.syncFromNeon('recipes');
      await this.syncFromNeon('menus');
      await this.syncFromNeon('freezer');
      await this.syncFromNeon('shopping');
      await this.syncFromNeon('prepPlans');
      await this.syncFromNeon('cookingSessions');
      await this.syncFromNeon('chefSettings');

      // Запускаем периодическую синхронизацию
      this.startPeriodicSync();
      
      logger.log('[SyncService] Инициализация завершена');
    } catch (error) {
      logger.error('[SyncService] Ошибка инициализации:', error);
    }
  }

  /**
   * Синхронизация из Neon → IndexedDB
   */
  private async syncFromNeon(tableName: TableName): Promise<void> {
    try {
      let items: SyncableItem[] = [];

      // Загружаем данные из Neon через API
      switch (tableName) {
        case 'recipes':
          items = (await apiDataService.recipes.list()) as SyncableItem[];
          break;
        case 'menus':
          const menu = await apiDataService.menus.getCurrent();
          items = menu ? [menu as SyncableItem] : [];
          break;
        case 'freezer':
          items = (await apiDataService.freezer.list()) as SyncableItem[];
          break;
        case 'shopping':
          items = (await apiDataService.shopping.list()) as SyncableItem[];
          break;
        case 'prepPlans':
          items = (await apiDataService.prepPlans.list()) as SyncableItem[];
          break;
        case 'cookingSessions':
          items = (await apiDataService.cookingSessions.list()) as SyncableItem[];
          break;
        case 'chefSettings':
          const settings = await apiDataService.chefSettings.get();
          items = settings ? [settings as SyncableItem] : [];
          break;
      }

      if (items.length === 0) {
        return;
      }

      // Сохраняем в IndexedDB с метаданными синхронизации
      const now = new Date().toISOString();
      const itemsWithSync: SyncableItem[] = items.map((item) => {
        const entity = item as unknown as EntityWithId;
        return {
          ...item,
          _sync: {
            syncStatus: 'synced' as const,
            lastSyncedAt: now,
            localUpdatedAt: entity.updatedAt || entity.createdAt || now,
          },
        };
      });

      await this.getTable(tableName).bulkPut(itemsWithSync);
      logger.log(`[SyncService] Синхронизировано ${items.length} записей из ${tableName}`);
    } catch (error) {
      logger.error(`[SyncService] Ошибка синхронизации ${tableName}:`, error);
      // Не бросаем ошибку, чтобы не блокировать другие таблицы
    }
  }

  /**
   * Синхронизация из IndexedDB → Neon (pending changes)
   */
  private async syncToNeon(tableName: TableName): Promise<void> {
    if (this.syncInProgress.has(tableName)) return;
    if (!this.isOnline) return;

    this.syncInProgress.add(tableName);

    try {
      // Находим все записи со статусом 'pending' или 'error'
      const allItems = await this.getTable(tableName).toArray() as SyncableItem[];
      const pendingItems = allItems.filter((item) => {
        const sync = item._sync;
        return sync && (sync.syncStatus === 'pending' || sync.syncStatus === 'error');
      });

      if (pendingItems.length === 0) {
        return;
      }

      for (const item of pendingItems) {
        const entity = item as unknown as EntityWithId & { _sync?: SyncMetadata };
        // shopping использует id как ключ в IndexedDB и API
        const dbKey = tableName === 'shopping'
          ? (item as ShoppingItem).id
          : entity.id;

        try {
          const { _sync, ...itemWithoutSync } = item;

          // Определяем операцию: create, update или delete
          const existing = await this.getTable(tableName).get(dbKey) as SyncableItem | undefined;
          const isNew = !existing || !existing._sync?.lastSyncedAt;

          if (isNew) {
            try {
              await this.createInNeon(tableName, itemWithoutSync);
            } catch (createError) {
              // Рецепты из seed уже могут быть в Neon → 409 Duplicate recipe
              const isConflict =
                tableName === 'recipes' &&
                createError instanceof Error &&
                (createError.message.includes('Duplicate') || createError.message.includes('Conflict'));
              if (isConflict) {
                await this.updateInNeon(tableName, dbKey, itemWithoutSync);
              } else {
                throw createError;
              }
            }
          } else {
            await this.updateInNeon(tableName, dbKey, itemWithoutSync);
          }

          // Обновляем метаданные синхронизации
          const syncUpdate: { _sync: SyncMetadata } = {
            _sync: {
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
              localUpdatedAt: item._sync?.localUpdatedAt || new Date().toISOString(),
              retryCount: 0,
            },
          };
          await this.getTable(tableName).update(dbKey, syncUpdate);

          logger.log(`[SyncService] Синхронизировано ${tableName}:${dbKey}`);
        } catch (error) {
          logger.error(`[SyncService] Ошибка синхронизации ${tableName}:${dbKey}:`, error);

          // Обновляем статус на 'error'
          const retryCount = (item._sync?.retryCount || 0) + 1;
          const failUpdate: { _sync: SyncMetadata } = {
            _sync: {
              ...item._sync,
              syncStatus: 'error',
              errorMessage: error instanceof Error ? error.message : String(error),
              localUpdatedAt: item._sync?.localUpdatedAt || new Date().toISOString(),
              retryCount,
            },
          };
          await this.getTable(tableName).update(dbKey, failUpdate);
        }
      }
    } catch (error) {
      logger.error(`[SyncService] Ошибка при синхронизации ${tableName}:`, error);
    } finally {
      this.syncInProgress.delete(tableName);
    }
  }

  /**
   * Создание записи в Neon
   */
  private async createInNeon(tableName: TableName, item: SyncableEntity): Promise<void> {
    // Внутри switch TS не сужает SyncableEntity по tableName,
    // поэтому используем явные cast к конкретному типу.
    switch (tableName) {
      case 'recipes':
        await apiDataService.recipes.create(item as Recipe);
        break;
      case 'menus':
        await apiDataService.menus.create(item as WeekMenu);
        break;
      case 'freezer':
        await apiDataService.freezer.create(item as FreezerItem);
        break;
      case 'shopping':
        await apiDataService.shopping.create(item as ShoppingItem);
        break;
      case 'prepPlans':
        await apiDataService.prepPlans.create(item as PrepPlan);
        break;
      case 'cookingSessions':
        await apiDataService.cookingSessions.create(item as CookingSession);
        break;
      case 'chefSettings':
        await apiDataService.chefSettings.save(item as ChefModeSettings);
        break;
    }
  }

  /**
   * Обновление записи в Neon
   */
  private async updateInNeon(tableName: TableName, id: string, item: SyncableEntity): Promise<void> {
    switch (tableName) {
      case 'recipes':
        await apiDataService.recipes.update(id, item as Partial<Recipe>);
        break;
      case 'menus':
        await apiDataService.menus.update(id, item as Partial<WeekMenu>);
        break;
      case 'freezer':
        await apiDataService.freezer.update(id, item as Partial<FreezerItem>);
        break;
      case 'shopping':
        await apiDataService.shopping.update(id, item as Partial<ShoppingItem>);
        break;
      case 'prepPlans':
        await apiDataService.prepPlans.update(id, item as Partial<PrepPlan>);
        break;
      case 'cookingSessions':
        await apiDataService.cookingSessions.update(id, item as Partial<CookingSession>);
        break;
      case 'chefSettings':
        await apiDataService.chefSettings.save(item as ChefModeSettings);
        break;
    }
  }

  /**
   * Запуск периодической синхронизации
   */
  private startPeriodicSync(): void {
    // Синхронизация каждые 30 секунд
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.syncAll().catch(logger.error);
      }
    }, 30000);
  }

  /**
   * Сразу отправить pending-рецепты в Neon (для Wabba: голоса не теряются после смены экрана/деплоя).
   */
  async syncRecipesNow(): Promise<void> {
    await this.syncToNeon('recipes');
  }

  /**
   * Синхронизация всех таблиц
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      logger.log('[SyncService] Офлайн — пропускаем синхронизацию');
      return;
    }

    const tables: TableName[] = [
      'recipes',
      'menus',
      'freezer',
      'shopping',
      'prepPlans',
      'cookingSessions',
      'chefSettings',
    ];

    try {
      // Сначала синхронизируем pending changes → Neon
      for (const table of tables) {
        await this.syncToNeon(table);
      }

      // Затем синхронизируем изменения из Neon → IndexedDB
      for (const table of tables) {
        await this.syncFromNeon(table);
      }
    } catch (error) {
      logger.error('[SyncService] Ошибка при синхронизации всех таблиц:', error);
    }
  }

  /**
   * Остановка синхронизации
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Получить статус синхронизации
   */
  async getSyncStatus(): Promise<{
    pendingCount: number;
    failedCount: number;
    isOnline: boolean;
  }> {
    const tables: TableName[] = [
      'recipes',
      'menus',
      'freezer',
      'shopping',
      'prepPlans',
      'cookingSessions',
      'chefSettings',
    ];

    let pendingCount = 0;
    let failedCount = 0;

    for (const table of tables) {
      const items = await this.getTable(table).toArray() as SyncableItem[];
      for (const item of items) {
        const sync = item._sync;
        if (sync) {
          if (sync.syncStatus === 'pending') pendingCount++;
          if (sync.syncStatus === 'error') failedCount++;
        }
      }
    }

    return {
      pendingCount,
      failedCount,
      isOnline: this.isOnline,
    };
  }
}

export const syncService = new SyncService();

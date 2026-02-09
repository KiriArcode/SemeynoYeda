/**
 * Sync Service — синхронизация Neon PostgreSQL ↔ IndexedDB
 * 
 * Стратегия:
 * - Optimistic updates: изменения сразу в IndexedDB
 * - Background sync: синхронизация в фоне
 * - Conflict resolution: last write wins (по updatedAt)
 */

import { db } from './db';
import { dataService } from './dataService';
import type {
  Recipe,
  WeekMenu,
  FreezerItem,
  ShoppingItem,
  PrepPlan,
  CookingSession,
  ChefModeSettings,
} from '../data/schema';

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

export interface SyncMetadata {
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string;
  syncError?: string;
  retryCount?: number;
  localUpdatedAt: string;
}

export type SyncableItem = SyncableEntity & {
  _sync?: SyncMetadata;
}

class SyncService {
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: Set<TableName> = new Set();
  private initialized = false;

  constructor() {
    // Слушаем события онлайн/офлайн
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('[SyncService] Онлайн — запускаем синхронизацию');
        this.syncAll().catch(console.error);
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('[SyncService] Офлайн — используем только IndexedDB');
      });
    }
  }

  /**
   * Инициализация: загрузка данных из Neon при старте
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.isOnline) {
      console.log('[SyncService] Офлайн при старте — используем только IndexedDB');
      return;
    }

    try {
      console.log('[SyncService] Инициализация синхронизации...');
      
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
      
      console.log('[SyncService] Инициализация завершена');
    } catch (error) {
      console.error('[SyncService] Ошибка инициализации:', error);
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
          items = (await dataService.recipes.list()) as SyncableItem[];
          break;
        case 'menus':
          const menu = await dataService.menus.getCurrent();
          items = menu ? [menu as SyncableItem] : [];
          break;
        case 'freezer':
          items = (await dataService.freezer.list()) as SyncableItem[];
          break;
        case 'shopping':
          items = (await dataService.shopping.list()) as SyncableItem[];
          break;
        case 'prepPlans':
          items = (await dataService.prepPlans.list()) as SyncableItem[];
          break;
        case 'cookingSessions':
          items = (await dataService.cookingSessions.list()) as SyncableItem[];
          break;
        case 'chefSettings':
          const settings = await dataService.chefSettings.get();
          items = settings ? [settings as SyncableItem] : [];
          break;
      }

      if (items.length === 0) {
        return;
      }

      // Сохраняем в IndexedDB с метаданными синхронизации
      const now = new Date().toISOString();
      const itemsWithSync: SyncableItem[] = items.map((item) => {
        return {
          ...item,
          _sync: {
            syncStatus: 'synced',
            lastSyncedAt: now,
            localUpdatedAt: (item as any).updatedAt || (item as any).createdAt || now,
          },
        };
      });

      await db.table(tableName).bulkPut(itemsWithSync as any);
      console.log(`[SyncService] Синхронизировано ${items.length} записей из ${tableName}`);
    } catch (error) {
      console.error(`[SyncService] Ошибка синхронизации ${tableName}:`, error);
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
      // Находим все записи со статусом 'pending' или 'failed'
      const allItems = await db.table(tableName).toArray();
      const pendingItems = allItems.filter((item: any) => {
        const sync = item._sync;
        return sync && (sync.syncStatus === 'pending' || sync.syncStatus === 'failed');
      }) as SyncableItem[];

      if (pendingItems.length === 0) {
        return;
      }

      for (const item of pendingItems) {
        try {
          const { _sync, ...itemWithoutSync } = item;

          // Определяем операцию: create, update или delete
          const existing = await db.table(tableName).get((itemWithoutSync as any).id);
          const isNew = !existing || !existing._sync?.lastSyncedAt;

          if (isNew) {
            // Create
            await this.createInNeon(tableName, itemWithoutSync as any);
          } else {
            // Update
            await this.updateInNeon(tableName, (itemWithoutSync as any).id, itemWithoutSync as any);
          }

          // Обновляем метаданные синхронизации
          await db.table(tableName).update((itemWithoutSync as any).id, {
            _sync: {
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
              localUpdatedAt: item._sync?.localUpdatedAt || new Date().toISOString(),
              retryCount: 0,
            },
          } as any);

          console.log(`[SyncService] Синхронизировано ${tableName}:${(itemWithoutSync as any).id}`);
        } catch (error) {
          console.error(`[SyncService] Ошибка синхронизации ${tableName}:${(item as any).id}:`, error);

          // Обновляем статус на 'failed'
          const retryCount = (item._sync?.retryCount || 0) + 1;
          await db.table(tableName).update((item as any).id, {
            _sync: {
              ...item._sync,
              syncStatus: 'failed',
              syncError: error instanceof Error ? error.message : String(error),
              retryCount,
            },
          } as any);
        }
      }
    } catch (error) {
      console.error(`[SyncService] Ошибка при синхронизации ${tableName}:`, error);
    } finally {
      this.syncInProgress.delete(tableName);
    }
  }

  /**
   * Создание записи в Neon
   */
  private async createInNeon(tableName: TableName, item: any): Promise<void> {
    switch (tableName) {
      case 'recipes':
        await dataService.recipes.create(item);
        break;
      case 'menus':
        await dataService.menus.create(item);
        break;
      case 'freezer':
        await dataService.freezer.create(item);
        break;
      case 'shopping':
        await dataService.shopping.create(item);
        break;
      case 'prepPlans':
        await dataService.prepPlans.create(item);
        break;
      case 'cookingSessions':
        await dataService.cookingSessions.create(item);
        break;
      case 'chefSettings':
        await dataService.chefSettings.save(item);
        break;
    }
  }

  /**
   * Обновление записи в Neon
   */
  private async updateInNeon(tableName: TableName, id: string, item: any): Promise<void> {
    switch (tableName) {
      case 'recipes':
        await dataService.recipes.update(id, item);
        break;
      case 'menus':
        await dataService.menus.update(id, item);
        break;
      case 'freezer':
        await dataService.freezer.update(id, item);
        break;
      case 'shopping':
        await dataService.shopping.update(item.ingredient, item);
        break;
      case 'prepPlans':
        await dataService.prepPlans.update(id, item);
        break;
      case 'cookingSessions':
        await dataService.cookingSessions.update(id, item);
        break;
      case 'chefSettings':
        await dataService.chefSettings.save(item);
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
        this.syncAll().catch(console.error);
      }
    }, 30000);
  }

  /**
   * Синхронизация всех таблиц
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncService] Офлайн — пропускаем синхронизацию');
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
      console.error('[SyncService] Ошибка при синхронизации всех таблиц:', error);
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
      const items = await db.table(table).toArray();
      for (const item of items) {
        const sync = (item as any)._sync;
        if (sync) {
          if (sync.syncStatus === 'pending') pendingCount++;
          if (sync.syncStatus === 'failed') failedCount++;
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

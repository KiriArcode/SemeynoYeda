# Архитектура Offline-First: Neon PostgreSQL ↔ IndexedDB

## Цели архитектуры

1. **База данных (Neon PostgreSQL)** — источник истины для синхронизации между устройствами
2. **IndexedDB (Dexie)** — локальный кэш для offline работы
3. **Онлайн доступ** — возможность смотреть рецепты и список покупок из разных устройств
4. **Offline-first** — приложение работает без интернета, синхронизируется при восстановлении сети

---

## Архитектурная схема

```
┌─────────────────────────────────────────────────────────────┐
│                    Фронтенд (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  dataService.ts → Sync Layer → IndexedDB (кэш)      │  │
│  │                      ↓                                │  │
│  │              Sync Queue (pending changes)            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Background Sync
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel Serverless Functions                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  api/data/[[...resource]].ts                         │  │
│  │  └─→ recipeRepo.ts → Neon PostgreSQL                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL (DATABASE_URL)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Neon PostgreSQL (Serverless)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  recipes, menus, freezer, shopping, etc.            │  │
│  │  + sync metadata (updated_at, version)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              IndexedDB (Dexie) - Local Cache                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  recipes, menus, freezer, shopping, etc.            │  │
│  │  + sync metadata (syncStatus, lastSyncedAt)         │  │
│  │  + syncQueue (pending changes)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Стратегия синхронизации

### Принципы

1. **Optimistic Updates** — изменения сразу сохраняются в IndexedDB, затем синхронизируются с Neon
2. **Last Write Wins** — при конфликтах побеждает последнее изменение (по `updatedAt`)
3. **Background Sync** — синхронизация происходит в фоне, не блокируя UI
4. **Incremental Sync** — синхронизируются только изменения с последнего sync

### Поток данных

#### Чтение данных
```
1. Запрос данных (например, recipes.list())
   ↓
2. Проверка: есть ли данные в IndexedDB?
   ├─ Да → возвращаем из IndexedDB (быстрый ответ)
   └─ Нет → загружаем из Neon → сохраняем в IndexedDB → возвращаем
   ↓
3. В фоне: проверяем обновления в Neon
   ├─ Есть изменения → обновляем IndexedDB
   └─ Нет изменений → ничего не делаем
```

#### Запись данных
```
1. Пользователь создаёт/обновляет данные
   ↓
2. Optimistic: сразу сохраняем в IndexedDB
   ├─ Статус: syncStatus = 'pending'
   └─ Возвращаем данные пользователю (быстрый ответ)
   ↓
3. Добавляем в syncQueue (очередь синхронизации)
   ↓
4. В фоне: пытаемся синхронизировать с Neon
   ├─ Успех → syncStatus = 'synced', lastSyncedAt = now()
   └─ Ошибка → syncStatus = 'failed', retryCount++
   ↓
5. При восстановлении сети: повторяем синхронизацию
```

---

## Расширение схемы данных

### Поля для синхронизации в IndexedDB

Добавить в каждую таблицу (recipes, menus, freezer, shopping, etc.):

```typescript
interface SyncMetadata {
  syncStatus: 'synced' | 'pending' | 'failed';  // статус синхронизации
  lastSyncedAt?: string;                        // ISO date последней синхронизации
  syncError?: string;                           // ошибка при синхронизации
  retryCount?: number;                          // количество попыток синхронизации
  localUpdatedAt: string;                       // ISO date локального изменения
}
```

### Поля для синхронизации в Neon PostgreSQL

Уже есть:
- `created_at` — дата создания
- `updated_at` — дата последнего обновления

Добавить (опционально, для более точной синхронизации):
- `version` — версия записи (increment при каждом изменении)
- `device_id` — ID устройства, которое сделало последнее изменение (для отладки)

---

## Структура Sync Layer

### Новый файл: `src/lib/syncService.ts`

```typescript
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
import type { Recipe, WeekMenu, FreezerItem, ShoppingItem, PrepPlan, CookingSession, ChefModeSettings } from '../data/schema';

type SyncableEntity = Recipe | WeekMenu | FreezerItem | ShoppingItem | PrepPlan | CookingSession | ChefModeSettings;
type TableName = 'recipes' | 'menus' | 'freezer' | 'shopping' | 'prepPlans' | 'cookingSessions' | 'chefSettings';

interface SyncMetadata {
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string;
  syncError?: string;
  retryCount?: number;
  localUpdatedAt: string;
}

interface SyncableItem extends SyncableEntity {
  _sync?: SyncMetadata;
}

class SyncService {
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: Set<TableName> = new Set();

  constructor() {
    // Слушаем события онлайн/офлайн
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncAll();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Инициализация: загрузка данных из Neon при старте
   */
  async initialize(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncService] Offline — используем только IndexedDB');
      return;
    }

    try {
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
          items = await dataService.recipes.list() as SyncableItem[];
          break;
        case 'menus':
          const menu = await dataService.menus.getCurrent();
          items = menu ? [menu as SyncableItem] : [];
          break;
        case 'freezer':
          items = await dataService.freezer.list() as SyncableItem[];
          break;
        case 'shopping':
          items = await dataService.shopping.list() as SyncableItem[];
          break;
        case 'prepPlans':
          items = await dataService.prepPlans.list() as SyncableItem[];
          break;
        case 'cookingSessions':
          items = await dataService.cookingSessions.list() as SyncableItem[];
          break;
        case 'chefSettings':
          const settings = await dataService.chefSettings.get();
          items = settings ? [settings as SyncableItem] : [];
          break;
      }

      // Сохраняем в IndexedDB с метаданными синхронизации
      const now = new Date().toISOString();
      const itemsWithSync: SyncableItem[] = items.map(item => ({
        ...item,
        _sync: {
          syncStatus: 'synced',
          lastSyncedAt: now,
          localUpdatedAt: item.updatedAt || item.createdAt,
        },
      }));

      await db.table(tableName).bulkPut(itemsWithSync);
      console.log(`[SyncService] Синхронизировано ${items.length} записей из ${tableName}`);
    } catch (error) {
      console.error(`[SyncService] Ошибка синхронизации ${tableName}:`, error);
      throw error;
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
      const pendingItems = await db.table(tableName)
        .filter(item => {
          const sync = (item as SyncableItem)._sync;
          return sync && (sync.syncStatus === 'pending' || sync.syncStatus === 'failed');
        })
        .toArray() as SyncableItem[];

      for (const item of pendingItems) {
        try {
          const { _sync, ...itemWithoutSync } = item;
          
          // Определяем операцию: create, update или delete
          const existing = await db.table(tableName).get(item.id);
          const isNew = !existing || !existing._sync?.lastSyncedAt;

          if (isNew) {
            // Create
            await this.createInNeon(tableName, itemWithoutSync as any);
          } else {
            // Update
            await this.updateInNeon(tableName, item.id, itemWithoutSync as any);
          }

          // Обновляем метаданные синхронизации
          await db.table(tableName).update(item.id, {
            _sync: {
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
              localUpdatedAt: item._sync?.localUpdatedAt || new Date().toISOString(),
              retryCount: 0,
            },
          } as any);

          console.log(`[SyncService] Синхронизировано ${tableName}:${item.id}`);
        } catch (error) {
          console.error(`[SyncService] Ошибка синхронизации ${tableName}:${item.id}:`, error);
          
          // Обновляем статус на 'failed'
          const retryCount = (item._sync?.retryCount || 0) + 1;
          await db.table(tableName).update(item.id, {
            _sync: {
              ...item._sync,
              syncStatus: 'failed',
              syncError: error instanceof Error ? error.message : String(error),
              retryCount,
            },
          } as any);
        }
      }
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
        this.syncAll();
      }
    }, 30000);
  }

  /**
   * Синхронизация всех таблиц
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline) return;

    const tables: TableName[] = ['recipes', 'menus', 'freezer', 'shopping', 'prepPlans', 'cookingSessions', 'chefSettings'];
    
    // Сначала синхронизируем pending changes → Neon
    for (const table of tables) {
      await this.syncToNeon(table);
    }

    // Затем синхронизируем изменения из Neon → IndexedDB
    for (const table of tables) {
      await this.syncFromNeon(table);
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
}

export const syncService = new SyncService();
```

---

## Обновление dataService для работы с IndexedDB

### Новый файл: `src/lib/dataServiceWithSync.ts`

```typescript
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
import { syncService } from './syncService';
import type { Recipe, WeekMenu, FreezerItem, ShoppingItem, PrepPlan, CookingSession, ChefModeSettings } from '../data/schema';

type SyncableEntity = Recipe | WeekMenu | FreezerItem | ShoppingItem | PrepPlan | CookingSession | ChefModeSettings;
type TableName = 'recipes' | 'menus' | 'freezer' | 'shopping' | 'prepPlans' | 'cookingSessions' | 'chefSettings';

interface SyncMetadata {
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string;
  syncError?: string;
  retryCount?: number;
  localUpdatedAt: string;
}

interface SyncableItem extends SyncableEntity {
  _sync?: SyncMetadata;
}

export const dataServiceWithSync = {
  recipes: {
    list: async (filters?: { category?: string; tags?: string[] }): Promise<Recipe[]> => {
      // Сначала возвращаем из IndexedDB (быстрый ответ)
      let cached = await db.recipes.toArray() as SyncableItem[];
      
      // Применяем фильтры
      if (filters?.category) {
        cached = cached.filter(r => r.category === filters.category);
      }
      if (filters?.tags?.length) {
        cached = cached.filter(r => filters.tags!.some(tag => r.tags.includes(tag as any)));
      }

      // В фоне синхронизируем с Neon
      if (navigator.onLine) {
        syncService.syncAll().catch(console.error);
      }

      // Убираем метаданные синхронизации перед возвратом
      return cached.map(({ _sync, ...item }) => item) as Recipe[];
    },

    get: async (id: string): Promise<Recipe | null> => {
      // Сначала проверяем IndexedDB
      const cached = await db.recipes.get(id) as SyncableItem | undefined;
      if (cached) {
        const { _sync, ...item } = cached;
        return item as Recipe;
      }

      // Если нет в кэше, загружаем из Neon
      if (navigator.onLine) {
        const item = await dataService.recipes.get(id);
        if (item) {
          // Сохраняем в IndexedDB
          await db.recipes.put({
            ...item,
            _sync: {
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
              localUpdatedAt: item.updatedAt,
            },
          } as any);
        }
        return item;
      }

      return null;
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

      // Optimistic: сразу сохраняем в IndexedDB
      await db.recipes.put(itemWithSync as any);

      // В фоне синхронизируем с Neon
      if (navigator.onLine) {
        syncService.syncAll().catch(console.error);
      }

      const { _sync, ...item } = itemWithSync;
      return item as Recipe;
    },

    update: async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
      // Получаем текущую версию из IndexedDB
      const existing = await db.recipes.get(id) as SyncableItem | undefined;
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

      const { _sync, ...item } = updated;
      return item as Recipe;
    },

    delete: async (id: string): Promise<void> => {
      // Optimistic: удаляем из IndexedDB
      await db.recipes.delete(id);

      // В фоне синхронизируем с Neon
      if (navigator.onLine) {
        try {
          await dataService.recipes.delete(id);
        } catch (error) {
          console.error('[dataServiceWithSync] Ошибка удаления:', error);
          // Можно добавить в очередь удалений для повторной попытки
        }
      }
    },
  },

  // Аналогично для других таблиц...
  menus: {
    getCurrent: async (): Promise<WeekMenu | null> => {
      // Логика аналогична recipes.get
      const cached = await db.menus.orderBy('createdAt').last() as SyncableItem | undefined;
      if (cached) {
        const { _sync, ...item } = cached;
        return item as WeekMenu;
      }

      if (navigator.onLine) {
        const item = await dataService.menus.getCurrent();
        if (item) {
          await db.menus.put({
            ...item,
            _sync: {
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
              localUpdatedAt: item.createdAt,
            },
          } as any);
        }
        return item;
      }

      return null;
    },
    // ... остальные методы
  },

  // ... остальные таблицы
};
```

---

## Инициализация синхронизации

### Обновление `src/main.tsx` или `src/app/Router.tsx`

```typescript
import { syncService } from './lib/syncService';

// При старте приложения
syncService.initialize().catch(console.error);
```

---

## Conflict Resolution

### Стратегия: Last Write Wins

При синхронизации из Neon → IndexedDB:

```typescript
// Если запись в Neon новее (updatedAt больше), обновляем IndexedDB
if (neonItem.updatedAt > cachedItem.updatedAt) {
  await db.table(tableName).put({
    ...neonItem,
    _sync: {
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      localUpdatedAt: neonItem.updatedAt,
    },
  });
}
```

### Альтернатива: User Choice

Для критичных данных можно показывать диалог выбора:
- "На сервере более новая версия. Использовать её?"
- "Сохранить локальную версию?"
- "Объединить изменения?"

---

## UI индикаторы синхронизации

### Компонент: `src/components/ui/SyncStatus.tsx`

```typescript
export function SyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const checkPending = async () => {
      // Подсчитываем pending изменения
      const pending = await db.recipes
        .filter(r => r._sync?.syncStatus === 'pending')
        .count();
      setPendingCount(pending);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="text-xs text-text-muted">
        ⚠️ Офлайн режим
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="text-xs text-portal">
        🔄 Синхронизация... ({pendingCount})
      </div>
    );
  }

  return (
    <div className="text-xs text-portal-dim">
      ✓ Синхронизировано
    </div>
  );
}
```

---

## Преимущества архитектуры

1. **Быстрый отклик** — данные сразу из IndexedDB, не ждём сеть
2. **Offline работа** — приложение работает без интернета
3. **Синхронизация между устройствами** — изменения синхронизируются через Neon
4. **Надёжность** — pending changes сохраняются и синхронизируются при восстановлении сети
5. **Масштабируемость** — можно добавить более сложные стратегии синхронизации

---

## Следующие шаги реализации

1. ✅ Создать `syncService.ts` с базовой логикой синхронизации
2. ✅ Создать `dataServiceWithSync.ts` как обёртку над dataService
3. ✅ Обновить схему IndexedDB для поддержки `_sync` метаданных
4. ✅ Добавить инициализацию syncService при старте приложения
5. ✅ Добавить UI индикаторы синхронизации
6. ✅ Протестировать offline/online сценарии
7. ✅ Добавить обработку ошибок и retry логику
8. ✅ Оптимизировать синхронизацию (incremental sync по updatedAt)

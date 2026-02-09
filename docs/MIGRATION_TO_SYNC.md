# Миграция на Offline-First синхронизацию

## Что было сделано

1. ✅ Создан `src/lib/syncService.ts` — сервис синхронизации Neon ↔ IndexedDB
2. ✅ Создан `src/lib/dataServiceWithSync.ts` — обёртка над dataService с поддержкой кэша
3. ✅ Создан `src/components/ui/SyncStatus.tsx` — компонент статуса синхронизации
4. ✅ Добавлена инициализация syncService в `src/main.tsx`
5. ✅ Добавлен SyncStatus в PageShell header

## Как переключиться на dataServiceWithSync

### Вариант 1: Постепенная миграция (рекомендуется)

Заменить импорты в компонентах по одному:

**Было:**
```typescript
import { dataService } from '../lib/dataService';
```

**Стало:**
```typescript
import { dataServiceWithSync as dataService } from '../lib/dataServiceWithSync';
```

### Вариант 2: Глобальная замена

Заменить все импорты `dataService` на `dataServiceWithSync`:

```typescript
// Везде заменить:
import { dataService } from '../lib/dataService';
// На:
import { dataServiceWithSync as dataService } from '../lib/dataServiceWithSync';
```

Или создать алиас в `src/lib/dataService.ts`:

```typescript
// В src/lib/dataService.ts добавить в конец:
export { dataServiceWithSync as dataService } from './dataServiceWithSync';
```

## Компоненты для обновления

Следующие компоненты используют `dataService` и должны быть обновлены:

- `src/pages/RecipesPage.tsx`
- `src/pages/RecipeDetailPage.tsx`
- `src/pages/RecipeEditPage.tsx`
- `src/pages/RecipeNewPage.tsx`
- `src/pages/MenuPage.tsx`
- `src/pages/FreezerPage.tsx`
- `src/pages/ShoppingPage.tsx`
- `src/pages/PrepPage.tsx`
- `src/pages/CookingPage.tsx`
- `src/pages/ChefSettingsPage.tsx`
- `src/components/cooking/CookingSession.tsx`
- `src/hooks/useShoppingList.ts`
- `src/hooks/usePrepPlan.ts`
- И другие компоненты, использующие dataService

## Проверка работы

1. **Открыть DevTools → Application → IndexedDB**
   - Проверить, что данные сохраняются в IndexedDB
   - Проверить наличие поля `_sync` в записях

2. **Проверить синхронизацию:**
   - Открыть DevTools → Network
   - Создать/обновить рецепт
   - Проверить, что запросы идут к API
   - Проверить статус синхронизации в header (SyncStatus компонент)

3. **Проверить offline режим:**
   - Отключить сеть (DevTools → Network → Offline)
   - Создать/обновить рецепт
   - Проверить, что данные сохраняются в IndexedDB
   - Включить сеть обратно
   - Проверить, что данные синхронизируются

## Отладка

### Логи синхронизации

Все логи синхронизации начинаются с `[SyncService]`:

```javascript
// В консоли браузера:
// [SyncService] Инициализация синхронизации...
// [SyncService] Синхронизировано 28 записей из recipes
// [SyncService] Синхронизировано recipes:recipe-id-123
```

### Проверка статуса синхронизации

```typescript
import { syncService } from './lib/syncService';

const status = await syncService.getSyncStatus();
console.log('Pending:', status.pendingCount);
console.log('Failed:', status.failedCount);
console.log('Online:', status.isOnline);
```

### Ручная синхронизация

```typescript
import { syncService } from './lib/syncService';

// Принудительная синхронизация всех таблиц
await syncService.syncAll();
```

## Известные ограничения

1. **Conflict Resolution:** Используется стратегия "last write wins" по `updatedAt`
   - Если нужна более сложная логика, нужно доработать `syncService.ts`

2. **Удаление записей:** При удалении запись сразу удаляется из IndexedDB
   - Если синхронизация с Neon не удалась, запись будет потеряна
   - Можно добавить очередь удалений для повторной попытки

3. **Shopping items:** Используют `ingredient` как ключ, а не `id`
   - Синхронизация может работать немного по-другому

## Следующие шаги

1. Протестировать синхронизацию на реальных данных
2. Добавить обработку ошибок для критичных операций
3. Оптимизировать синхронизацию (incremental sync по updatedAt)
4. Добавить UI для ручной синхронизации
5. Добавить индикатор прогресса синхронизации

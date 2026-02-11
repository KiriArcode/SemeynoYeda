# Применение миграций в Neon

Проект использует **Neon PostgreSQL** для хранения данных. Миграции хранятся в папке `supabase/migrations/` (название папки осталось от исторических причин, но миграции применяются к Neon).

## Применение миграций

### Способ 1: Через Neon Console (рекомендуется)

1. Откройте [Neon Console](https://console.neon.tech/)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor**
4. Скопируйте содержимое файла миграции из `supabase/migrations/`
5. Вставьте SQL в редактор и выполните (Run)

### Способ 2: Через psql или клиент PostgreSQL

```bash
# Установите переменную окружения DATABASE_URL
export DATABASE_URL="postgresql://user:password@host.tld/dbname?sslmode=require"

# Примените миграцию
psql "$DATABASE_URL" -f supabase/migrations/20250211000001_wabba_recipe_fields.sql
```

### Способ 3: Через Node.js скрипт

Создайте временный скрипт для применения миграции:

```typescript
// scripts/applyMigration.ts
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const migrationFile = join(__dirname, '../supabase/migrations/20250211000001_wabba_recipe_fields.sql');
const migrationSQL = readFileSync(migrationFile, 'utf-8');

async function applyMigration() {
  try {
    await sql(migrationSQL);
    console.log('✅ Migration applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
```

Запуск:
```bash
DATABASE_URL="postgresql://..." npx tsx scripts/applyMigration.ts
```

## Доступные миграции

### `20250208000001_initial_schema.sql`
Начальная схема базы данных (таблицы `recipes`, `menus`, `freezer`, `shopping`, `prep_plans`, `cooking_sessions`, `chef_settings`).

### `20250208000002_rls.sql`
Row Level Security политики (если используются).

### `20250211000001_wabba_recipe_fields.sql`
Добавляет поля для функциональности Wabba:
- `wabba_ratings JSONB` — оценки Коля/Кристина
- `excluded_from_menu BOOLEAN DEFAULT FALSE` — исключение из меню
- Индекс `idx_recipes_created_at` для фильтрации по дате создания

## Проверка применения миграции

После применения миграции проверьте структуру таблицы:

```sql
-- Проверить наличие новых колонок
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' 
  AND column_name IN ('wabba_ratings', 'excluded_from_menu');

-- Проверить наличие индекса
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'recipes' 
  AND indexname = 'idx_recipes_created_at';
```

## Важно

- Миграции применяются **вручную** через Neon Console или SQL клиент
- Перед применением миграции убедитесь, что у вас есть резервная копия базы данных
- Миграции идут в хронологическом порядке по имени файла
- После применения миграции в Neon, данные автоматически синхронизируются с IndexedDB через `syncService`

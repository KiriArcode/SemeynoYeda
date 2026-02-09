# Анализ ошибок консоли

## 1. ⚠️ Manifest Icon Warning

**Ошибка:**
```
Error while trying to use the following icon from the Manifest: 
https://semeyno-yeda-git-main-kiris-projects-ba381c8c.vercel.app/icons/icon.svg 
(Download error or resource isn't a valid image)
```

**Причина:**
- Манифест PWA использует SVG-иконку (`icons/icon.svg`)
- Многие браузеры не полностью поддерживают SVG в манифесте PWA
- Для PWA рекомендуется использовать PNG-иконки размером 192x192 и 512x512

**Решение:**
1. Создать PNG-версии иконки (192x192 и 512x512)
2. Обновить `vite.config.ts` для использования PNG вместо SVG
3. Или оставить как есть — это предупреждение, не критическая ошибка

**Файлы для изменения:**
- `vite.config.ts` — обновить манифест с PNG-иконками
- `public/icons/` — добавить `icon-192.png` и `icon-512.png`

---

## 2. ❌ Shopping List API 404

**Ошибка:**
```
GET https://semeyno-yeda-git-main-kiris-projects-ba381c8c.vercel.app/api/shopping 404 (Not Found)
Failed to load shopping list: Error
```

**Причина:**
API-роут существует (`api/shopping/[[...slug]].ts`), но возвращает 404. Возможные причины:

1. **Отсутствует DATABASE_URL в Vercel**
   - Проверьте: Vercel Dashboard → Settings → Environment Variables
   - Должна быть переменная `DATABASE_URL` с подключением к Neon

2. **Проблема с маршрутизацией Vercel**
   - Роут должен быть доступен по `/api/shopping`
   - Проверьте `vercel.json` — rewrite правила могут перехватывать запросы

3. **Ошибка подключения к базе данных**
   - API-роут пытается подключиться к Neon, но не может
   - Проверьте логи Vercel Functions для деталей

**Решение:**
1. Проверьте переменные окружения в Vercel:
   ```bash
   # В Vercel Dashboard → Settings → Environment Variables
   DATABASE_URL=postgresql://neondb_owner:...@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

2. Проверьте логи Vercel:
   - Vercel Dashboard → Deployments → [latest] → Functions
   - Найдите `/api/shopping` и проверьте ошибки

3. Проверьте, что таблица `shopping` существует в базе данных:
   ```sql
   SELECT * FROM shopping LIMIT 1;
   ```

**Файлы для проверки:**
- `api/shopping/[[...slug]].ts` — обработчик API
- `api/_lib/repositories/shoppingRepo.ts` — репозиторий
- `.env` (локально) и Vercel Environment Variables (production)

---

## 3. ❌ Recipe Detail 404

**Ошибка:**
```
GET https://semeyno-yeda-git-main-kiris-projects-ba381c8c.vercel.app/api/data/recipes/seed-banan-jogurt 404 (Not Found)
Failed to load recipe: Error
```

**Причина:**
Рецепт с ID `seed-banan-jogurt` не существует в базе данных Neon. Это seed-данные, которые нужно загрузить.

**Решение:**
1. Запустить seed-скрипт для загрузки рецептов в Neon:
   ```bash
   npm run seed:neon
   # или
   tsx scripts/seedNeon.ts
   ```

2. Проверить, что рецепт загружен:
   ```sql
   SELECT id, title FROM recipes WHERE id = 'seed-banan-jogurt';
   ```

3. Если рецепт не найден в seed-файлах, проверьте:
   - `src/data/seedRecipes.ts` — список seed-рецептов
   - Возможно, рецепт был удалён или переименован

**Файлы для проверки:**
- `scripts/seedNeon.ts` — скрипт загрузки seed-данных
- `src/data/seedRecipes.ts` — список рецептов для загрузки
- `api/_lib/repositories/recipeRepo.ts` — репозиторий рецептов

---

## 4. ✅ Успешные запросы

**Хорошие новости:**
- Меню недели загружается успешно
- Рецепты для meal slots загружаются корректно
- API `/api/data/recipes` работает для списка рецептов

**Логи показывают:**
```
[MealSlot:breakfast] Loaded 3/3 recipes
[MealSlot:lunch] Loaded 6/6 recipes
...
```

Это означает, что основная функциональность работает, но есть проблемы с:
- Shopping list API (404)
- Отдельным рецептом (не загружен в БД)

---

## Рекомендации по исправлению

### Приоритет 1: Shopping List API
1. Проверьте `DATABASE_URL` в Vercel Environment Variables
2. Проверьте логи Vercel Functions для `/api/shopping`
3. Убедитесь, что таблица `shopping` существует в Neon

### Приоритет 2: Recipe Seed Data
1. Запустите seed-скрипт для загрузки рецептов
2. Проверьте, что все seed-рецепты загружены

### Приоритет 3: Manifest Icon (низкий приоритет)
1. Создайте PNG-иконки для PWA
2. Обновите манифест в `vite.config.ts`

---

## Проверка окружения

### Локально:
```bash
# Проверьте .env файл
cat .env | grep DATABASE_URL

# Проверьте подключение к базе
npm run seed:neon
```

### В Vercel:
1. Vercel Dashboard → Settings → Environment Variables
2. Убедитесь, что `DATABASE_URL` установлен для всех окружений (Production, Preview, Development)
3. Проверьте логи: Deployments → [latest] → Functions → `/api/shopping`

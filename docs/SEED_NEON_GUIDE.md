# Инструкция по загрузке seed-данных в Neon

## Проблема с командной строкой

В zsh символ `&` имеет специальное значение (запуск процесса в фоне), поэтому его нужно экранировать или использовать кавычки.

## ✅ Правильные способы запуска

### Способ 1: Использование .env файла (рекомендуется) ✨

Скрипт теперь автоматически читает `DATABASE_URL` из `.env` файла! Просто убедитесь, что в `.env` есть строка:

```
DATABASE_URL=postgresql://neondb_owner:npg_mvu3wA6dSDaU@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Затем просто запустите:

```bash
npm run seed:neon
```

### Способ 2: Одинарные кавычки (если нужно переопределить)

```bash
DATABASE_URL='postgresql://neondb_owner:npg_mvu3wA6dSDaU@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' npm run seed:neon
```

### Способ 3: Экспорт переменной окружения

```bash
export DATABASE_URL='postgresql://neondb_owner:npg_mvu3wA6dSDaU@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
npm run seed:neon
```

### Способ 4: Экранирование символа &

```bash
DATABASE_URL="postgresql://neondb_owner:npg_mvu3wA6dSDaU@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require\&channel_binding=require" npm run seed:neon
```

## Проверка установки зависимостей

Убедитесь, что `tsx` установлен:

```bash
npm install
```

Проверьте, что `tsx` доступен:

```bash
npx tsx --version
```

## Альтернативный способ: использование npx напрямую

Если `npm run seed:neon` не работает, используйте:

```bash
DATABASE_URL='postgresql://neondb_owner:npg_mvu3wA6dSDaU@ep-small-salad-aieorqt5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' npx tsx scripts/seedNeon.ts
```

## Что делает скрипт

1. Загружает seed-рецепты из `src/data/seedRecipes.ts`
2. Загружает seed-меню из `src/data/seedMenu.ts`
3. Использует `ON CONFLICT` для безопасного upsert (не дублирует данные)

## Ожидаемый вывод при успехе

```
Seeding 45 recipes...
Recipes seeded OK
Seeding menu...
Menu seeded OK
Seed complete.
```

## Устранение проблем

### Ошибка: "command not found: tsx"
```bash
npm install
```

### Ошибка: "parse error near `&'"
Используйте одинарные кавычки вокруг URL или экранируйте `&` как `\&`

### Ошибка: "Missing env: DATABASE_URL"
Убедитесь, что переменная передана правильно с кавычками

### Ошибка подключения к базе данных
Проверьте:
1. Правильность строки подключения
2. Доступность базы данных Neon
3. Наличие таблиц `recipes` и `menus` в базе

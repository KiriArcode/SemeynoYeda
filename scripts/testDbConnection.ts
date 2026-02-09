/**
 * Тест подключения к Neon PostgreSQL базе данных.
 * Запуск: npx tsx scripts/testDbConnection.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

// Загружаем .env файл если он существует
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;
      
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      
      // Убираем кавычки если есть
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key && value) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    // .env файл не найден или не может быть прочитан - это нормально
  }
}

// Загружаем переменные из .env
loadEnvFile();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Ошибка: DATABASE_URL не установлена в переменных окружения');
  console.error('');
  console.error('Варианты решения:');
  console.error('1. Добавьте DATABASE_URL в файл .env в корне проекта');
  console.error('2. Или экспортируйте переменную: export DATABASE_URL="postgresql://..."');
  console.error('3. Или запустите с inline переменной: DATABASE_URL="postgresql://..." npm run test:db');
  process.exit(1);
}

async function testConnection() {
  console.log('🔌 Тестирование подключения к Neon PostgreSQL...');
  console.log(`📡 URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // Скрываем пароль

  try {
    const sql = neon(DATABASE_URL);
    
    // Простой тест: проверяем версию PostgreSQL
    const result = await sql`SELECT version() as version, current_database() as database`;
    
    if (Array.isArray(result) && result.length > 0) {
      const row = result[0] as { version: string; database: string };
      console.log('✅ Подключение успешно!');
      console.log(`📊 База данных: ${row.database}`);
      console.log(`🔧 Версия PostgreSQL: ${row.version.split(' ')[0]} ${row.version.split(' ')[1]}`);
      
      // Проверяем наличие таблиц
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      if (Array.isArray(tables) && tables.length > 0) {
        console.log(`\n📋 Найдено таблиц: ${tables.length}`);
        tables.forEach((t: { table_name: string }) => {
          console.log(`   - ${t.table_name}`);
        });
      } else {
        console.log('\n⚠️  Таблицы не найдены. Возможно, нужно выполнить миграцию.');
      }
      
      // Проверяем количество рецептов
      try {
        const recipes = await sql`SELECT COUNT(*) as count FROM recipes`;
        if (Array.isArray(recipes) && recipes.length > 0) {
          const count = recipes[0] as { count: string };
          console.log(`\n📚 Рецептов в базе: ${count.count}`);
        }
      } catch (err) {
        console.log('\n⚠️  Таблица recipes не найдена или недоступна');
      }
      
    } else {
      console.error('❌ Неожиданный формат ответа от базы данных');
      process.exit(1);
    }
    
    console.log('\n✅ Все проверки пройдены успешно!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка подключения:');
    if (error instanceof Error) {
      console.error(`   Сообщение: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    } else {
      console.error('   Неизвестная ошибка:', error);
    }
    process.exit(1);
  }
}

testConnection();

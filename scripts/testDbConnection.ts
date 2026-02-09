/**
 * Тест подключения к Neon PostgreSQL базе данных.
 * Запуск: npx tsx scripts/testDbConnection.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Ошибка: DATABASE_URL не установлена в переменных окружения');
  console.error('Установите переменную: export DATABASE_URL="postgresql://..."');
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

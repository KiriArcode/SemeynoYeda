import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { WeekMenu } from '../data/schema';
import { MealSlot } from '../components/menu/MealSlot';
import { Calendar } from 'lucide-react';

export default function MenuPage() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekMenu();
  }, []);

  async function loadWeekMenu() {
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      if (menu) {
        setWeekMenu(menu);
      }
    } catch (error) {
      console.error('Failed to load week menu:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка меню...</div>
        </div>
      </div>
    );
  }

  if (!weekMenu) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-5 text-center shadow-card">
          <h2 className="font-heading text-xl font-bold text-text-light mb-2">
            Вселенная голодна 🌀
          </h2>
          <p className="text-text-mid font-body mb-4">
            Запланируем неделю?
          </p>
          <div className="mt-4 pt-4 border-t border-nebula">
            <p className="text-sm text-text-dim font-body mb-4">
              Начните с просмотра рецептов или создайте меню на неделю
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Link
                to="/recipes"
                className="px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow hover:shadow-glow/80 transition-all hover:scale-105"
              >
                Посмотреть рецепты
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <h1 className="font-heading text-2xl font-bold text-text-light mb-6">
        Меню недели
      </h1>

      <div className="space-y-4">
        {weekMenu.days.map((day) => (
          <div key={day.date} className="bg-dimension border border-nebula rounded-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-portal" />
              <h2 className="font-heading font-semibold text-text-light">
                {day.dayOfWeek}, {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </h2>
            </div>

            <div className="space-y-3">
              {day.meals.map((meal, index) => (
                <MealSlot key={index} slot={meal} date={day.date} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

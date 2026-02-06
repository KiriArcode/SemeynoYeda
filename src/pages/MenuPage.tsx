import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import type { WeekMenu, MealSlot as MealSlotType, MealType } from '../data/schema';
import { getSeedWeekMenu } from '../data/seedMenu';
import { MealSlot } from '../components/menu/MealSlot';
import { WeekStats } from '../components/menu/WeekStats';
import { AlertBanner } from '../components/ui/AlertBanner';
import { useFreezerAlerts } from '../hooks/useFreezerAlerts';
import { Calendar, Copy, CheckCircle2 } from 'lucide-react';

const DAY_LABELS: Record<string, string> = {
  'Понедельник': 'Пн',
  'Вторник': 'Вт',
  'Среда': 'Ср',
  'Четверг': 'Чт',
  'Пятница': 'Пт',
  'Суббота': 'Сб',
  'Воскресенье': 'Вс',
};

const MEAL_FILTERS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'breakfast', label: '🌅 Завтрак' },
  { value: 'lunch', label: '🍽️ Обед' },
  { value: 'snack', label: '🍎 Полдник' },
  { value: 'dinner', label: '🌙 Ужин' },
];

export default function MenuPage() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  const { alerts } = useFreezerAlerts(weekMenu);

  useEffect(() => {
    loadWeekMenu();
  }, []);

  async function loadWeekMenu() {
    console.log('[MenuPage] Loading week menu...');
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      if (menu) {
        console.log(`[MenuPage] Menu loaded: ${menu.id}, ${menu.days?.length || 0} days`);
        setWeekMenu(menu);
      } else {
        console.log('[MenuPage] No menu found');
        setWeekMenu(null);
      }
    } catch (error) {
      console.error('[MenuPage] Failed to load week menu:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createMenuFromTemplate() {
    console.log('[MenuPage] Creating menu from template...');
    setCreatingFromTemplate(true);
    setTemplateSuccess(false);
    try {
      const menu = getSeedWeekMenu();
      await db.table('menus').put(menu);
      await loadWeekMenu();
      setTemplateSuccess(true);
      setTimeout(() => setTemplateSuccess(false), 3000);
    } catch (error) {
      console.error('[MenuPage] Failed to create menu from template:', error);
    } finally {
      setCreatingFromTemplate(false);
    }
  }

  async function handleMealSlotUpdate(dayDate: string, mealIndex: number, updatedSlot: MealSlotType) {
    if (!weekMenu) return;
    console.log(`[MenuPage] Updating slot ${mealIndex} on ${dayDate}`);
    const updatedDays = weekMenu.days.map(day => {
      if (day.date !== dayDate) return day;
      return {
        ...day,
        meals: day.meals.map((m, i) => i === mealIndex ? updatedSlot : m),
      };
    });
    const updatedMenu = { ...weekMenu, days: updatedDays };
    await db.table('menus').put(updatedMenu);
    setWeekMenu(updatedMenu);
  }

  // Filtered days
  const filteredDays = useMemo(() => {
    if (!weekMenu) return [];
    let days = weekMenu.days;

    if (dayFilter !== 'all') {
      days = days.filter(d => d.dayOfWeek === dayFilter);
    }

    if (mealFilter !== 'all') {
      days = days.map(d => ({
        ...d,
        meals: d.meals.filter(m => m.mealType === mealFilter),
      })).filter(d => d.meals.length > 0);
    }

    return days;
  }, [weekMenu, dayFilter, mealFilter]);

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
          <p className="text-text-mid font-body mb-4">Запланируем неделю?</p>
          <div className="mt-4 pt-4 border-t border-nebula">
            <p className="text-sm text-text-dim font-body mb-4">
              Начните с просмотра рецептов или создайте меню на неделю
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                type="button"
                onClick={createMenuFromTemplate}
                disabled={creatingFromTemplate}
                className="px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow hover:shadow-glow/80 transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {creatingFromTemplate ? 'Создаём...' : 'Создать меню из шаблона'}
              </button>
              <Link
                to="/recipes"
                className="px-6 py-3 bg-rift border border-nebula text-text-light font-heading font-semibold rounded-button hover:bg-nebula hover:border-portal/30 transition-colors"
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
    <div className="container mx-auto px-4 py-4 pb-24">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between mb-4" style={{ gap: '8px' }}>
        <h1 className="font-heading text-2xl font-bold text-text-light">
          Меню недели
        </h1>
        <div className="flex items-center" style={{ gap: '8px' }}>
          {templateSuccess && (
            <span className="flex items-center text-xs text-portal font-body animate-fade-in" style={{ gap: '4px' }}>
              <CheckCircle2 className="w-4 h-4" /> Готово!
            </span>
          )}
          <button
            type="button"
            onClick={createMenuFromTemplate}
            disabled={creatingFromTemplate}
            className="flex items-center px-3 py-1.5 text-xs font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors disabled:opacity-60"
            style={{ gap: '6px' }}
          >
            <Copy className="w-3.5 h-3.5" />
            {creatingFromTemplate ? 'Создаём...' : 'Из шаблона'}
          </button>
        </div>
      </div>

      {/* Day filter */}
      <div className="flex items-center overflow-x-auto mb-2" style={{ gap: '4px' }}>
        <button
          onClick={() => setDayFilter('all')}
          className={`px-3 py-1.5 text-xs font-heading font-semibold whitespace-nowrap transition-colors border ${
            dayFilter === 'all'
              ? 'bg-portal/20 text-portal border-portal/50'
              : 'bg-rift text-text-dim border-nebula hover:border-portal/30'
          }`}
          style={{ borderRadius: '9999px' }}
        >
          Вся неделя
        </button>
        {weekMenu.days.map((day) => {
          const short = DAY_LABELS[day.dayOfWeek] || day.dayOfWeek.slice(0, 2);
          const active = dayFilter === day.dayOfWeek;
          return (
            <button
              key={day.date}
              onClick={() => setDayFilter(active ? 'all' : day.dayOfWeek)}
              className={`px-3 py-1.5 text-xs font-heading font-semibold whitespace-nowrap transition-colors border ${
                active
                  ? 'bg-portal/20 text-portal border-portal/50'
                  : 'bg-rift text-text-dim border-nebula hover:border-portal/30'
              }`}
              style={{ borderRadius: '9999px' }}
            >
              {short}
            </button>
          );
        })}
      </div>

      {/* Meal type filter */}
      <div className="flex items-center overflow-x-auto mb-4" style={{ gap: '4px' }}>
        {MEAL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setMealFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-heading font-semibold whitespace-nowrap transition-colors border ${
              mealFilter === f.value
                ? 'bg-miso/20 text-miso border-miso/50'
                : 'bg-rift text-text-dim border-nebula hover:border-miso/30'
            }`}
            style={{ borderRadius: '9999px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Diversity stats */}
      <WeekStats weekMenu={weekMenu} />

      {/* Freezer alerts */}
      {alerts.map((alert, i) => (
        <AlertBanner key={i} type={alert.type} message={alert.message} className="mb-3" />
      ))}

      {/* Days */}
      <div className="space-y-4">
        {filteredDays.map((day) => (
          <div key={day.date} className="bg-dimension border border-nebula rounded-card p-4 shadow-card animate-card-appear">
            <div className="flex items-center mb-3" style={{ gap: '8px' }}>
              <Calendar className="w-4 h-4 text-portal" />
              <h2 className="font-heading font-semibold text-text-light text-sm">
                {day.dayOfWeek}, {new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </h2>
            </div>

            <div className="space-y-3">
              {day.meals.map((meal, index) => (
                <MealSlot
                  key={`${day.date}-${meal.mealType}-${index}`}
                  slot={meal}
                  date={day.date}
                  onUpdate={(updated) => handleMealSlotUpdate(day.date, index, updated)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredDays.length === 0 && (
          <div className="bg-dimension border border-nebula rounded-card p-5 text-center">
            <p className="text-text-dim font-body text-sm">Нет блюд по этому фильтру</p>
          </div>
        )}
      </div>
    </div>
  );
}

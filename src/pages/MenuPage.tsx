import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { WeekMenu, MealSlot as MealSlotType, MealType } from '../data/schema';
import type { Recipe } from '../data/schema';
import { getSeedWeekMenu } from '../data/seedMenu';
import { MealSlot } from '../components/menu/MealSlot';
import { SwapModal } from '../components/menu/SwapModal';
import { WeekOverview } from '../components/menu/WeekOverview';
import { WeekStats } from '../components/menu/WeekStats';
import { AlertBanner } from '../components/ui/AlertBanner';
import { useFreezerAlerts } from '../hooks/useFreezerAlerts';
import { Copy, CheckCircle2, Heart } from 'lucide-react';

const DAY_SHORT_CODES: Record<string, string> = {
  'Понедельник': 'MON',
  'Вторник': 'TUE',
  'Среда': 'WED',
  'Четверг': 'THU',
  'Пятница': 'FRI',
  'Суббота': 'SAT',
  'Воскресенье': 'SUN',
};

const MEAL_FILTERS: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'breakfast', label: '🌅 Завтрак' },
  { value: 'second_breakfast', label: '🍎 Второй завтрак' },
  { value: 'lunch', label: '☀️ Обед' },
  { value: 'snack', label: '🍵 Полдник' },
  { value: 'dinner', label: '🌙 Ужин' },
  { value: 'late_snack', label: '🥛 Второй ужин' },
];

export function MenuPage() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);
  const [dayFilter, setDayFilter] = useState<string>('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  // Accordion: track which meal is expanded per day (dayDate -> mealIndex)
  const [expandedMeals, setExpandedMeals] = useState<Record<string, number>>({});
  // Swap modal: one at page level (dayDate, mealIndex, recipeIndexInSlot)
  const [swapTarget, setSwapTarget] = useState<{
    dayDate: string;
    mealIndex: number;
    recipeIndexInSlot: number;
  } | null>(null);
  const { alerts } = useFreezerAlerts(weekMenu);

  useEffect(() => {
    loadWeekMenu();
  }, []);

  // Initialize accordion: first meal of each day expanded
  useEffect(() => {
    if (weekMenu) {
      const initial: Record<string, number> = {};
      for (const day of weekMenu.days) {
        if (day.meals.length > 0) {
          initial[day.date] = 0;
        }
      }
      setExpandedMeals(initial);
    }
  }, [weekMenu?.id]);

  async function loadWeekMenu() {
    logger.log('[MenuPage] Loading week menu...');
    try {
      const menu = await dataService.menus.getCurrent();
      if (menu != null) {
        logger.log(`[MenuPage] Menu loaded: ${menu.id}, ${menu.days?.length || 0} days`);
        setWeekMenu(menu);
      } else {
        logger.log('[MenuPage] No menu found');
        setWeekMenu(null);
      }
    } catch (error) {
      logger.error('[MenuPage] Failed to load week menu:', error);
      setWeekMenu(null);
    } finally {
      setLoading(false);
    }
  }

  async function createMenuFromTemplate() {
    logger.log('[MenuPage] Creating menu from template...');
    console.log('[MenuPage] createMenuFromTemplate: start');
    setCreatingFromTemplate(true);
    setTemplateSuccess(false);
    try {
      const menu = getSeedWeekMenu();
      await dataService.menus.create(menu);
      console.log('[MenuPage] createMenuFromTemplate: menu created', { id: menu.id, weekStart: menu.weekStart });
      await loadWeekMenu();
      setTemplateSuccess(true);
      setTimeout(() => setTemplateSuccess(false), 3000);
    } catch (error) {
      logger.error('[MenuPage] Failed to create menu from template:', error);
      console.error('[MenuPage] createMenuFromTemplate: failed', error);
    } finally {
      setCreatingFromTemplate(false);
    }
  }

  async function handleMealSlotUpdate(dayDate: string, mealIndex: number, updatedSlot: MealSlotType) {
    if (!weekMenu) return;
    logger.log(`[MenuPage] Updating slot ${mealIndex} on ${dayDate}`);
    console.log('[MenuPage] handleMealSlotUpdate', { dayDate, mealIndex, recipeIds: updatedSlot.recipes.map(r => r.recipeId) });
    const updatedDays = weekMenu.days.map(day => {
      if (day.date !== dayDate) return day;
      return {
        ...day,
        meals: day.meals.map((m, i) => i === mealIndex ? updatedSlot : m),
      };
    });
    const updatedMenu = { ...weekMenu, days: updatedDays };
    await dataService.menus.update(updatedMenu.id, updatedMenu);
    console.log('[MenuPage] handleMealSlotUpdate: menu saved', { menuId: updatedMenu.id });
    setWeekMenu(updatedMenu);
  }

  const handleToggleMeal = useCallback((dayDate: string, mealIndex: number) => {
    setExpandedMeals(prev => ({
      ...prev,
      [dayDate]: prev[dayDate] === mealIndex ? -1 : mealIndex,
    }));
  }, []);

  function handleSwapSelect(newRecipe: Recipe) {
    if (!weekMenu || !swapTarget) return;
    const day = weekMenu.days.find((d) => d.date === swapTarget.dayDate);
    if (!day) return;
    const slot = day.meals[swapTarget.mealIndex];
    if (!slot) return;
    const updatedSlot: MealSlotType = {
      ...slot,
      recipes: slot.recipes.map((r, i) =>
        i === swapTarget.recipeIndexInSlot ? { ...r, recipeId: newRecipe.id } : r
      ),
    };
    handleMealSlotUpdate(swapTarget.dayDate, swapTarget.mealIndex, updatedSlot);
    setSwapTarget(null);
  }

  // Filtered days
  const filteredDays = useMemo(() => {
    if (!weekMenu) return [];
    let days = weekMenu.days;

    if (dayFilter) {
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
        <div className="bg-panel border border-elevated rounded-card p-4">
          <div className="text-text-secondary font-body">Загрузка меню...</div>
        </div>
      </div>
    );
  }

  if (!weekMenu) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-panel border border-elevated rounded-card p-6 text-center shadow-card">
          <div className="text-[10px] font-mono text-text-ghost tracking-widest mb-1">宇宙は空腹</div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
            Вселенная голодна
          </h2>
          <p className="text-text-secondary font-body mb-4">Запланируем неделю?</p>
          <div className="mt-4 pt-4 border-t border-nebula">
            <p className="text-sm text-text-muted font-body mb-4">
              Начните с просмотра рецептов или создайте меню на неделю
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Link
                to="/wabba"
                className="px-6 py-3 bg-rift border border-portal/50 text-portal font-heading font-semibold rounded-button hover:bg-portal/10 transition-colors flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Wabba — оценить рецепты
              </Link>
              <button
                type="button"
                onClick={createMenuFromTemplate}
                disabled={creatingFromTemplate}
                className="px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow hover:shadow-glow/80 transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2"
                aria-label="Создать меню (創建列表)"
              >
                <Copy className="w-4 h-4" />
                {creatingFromTemplate ? 'Создаём...' : '創建列表'}
              </button>
              <Link
                to="/recipes"
                className="px-6 py-3 bg-rift border border-nebula text-text-primary font-heading font-semibold rounded-button hover:bg-nebula hover:border-portal/30 transition-colors"
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
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Меню недели
        </h1>
        <div className="flex items-center gap-2">
          {templateSuccess && (
            <span className="flex items-center gap-1 text-xs text-portal font-body animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Готово!
            </span>
          )}
          <Link
            to="/wabba"
            className="flex min-w-[44px] min-h-[44px] items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors"
            aria-label="Wabba — оценить рецепты"
          >
            <Heart className="w-3.5 h-3.5" />
            Wabba
          </Link>
          <button
            type="button"
            onClick={createMenuFromTemplate}
            disabled={creatingFromTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors disabled:opacity-60"
            aria-label="Создать меню (創建列表)"
          >
            <Copy className="w-3.5 h-3.5" />
            {creatingFromTemplate ? 'Создаём...' : '創建列表'}
          </button>
        </div>
      </div>

      {/* Week Overview strip */}
      <WeekOverview
        days={weekMenu.days}
        activeDay={dayFilter || null}
        onDayClick={(dow) => setDayFilter(dow)}
      />

      {/* Meal type filter */}
      <div className="flex items-center overflow-x-auto mb-4 gap-1">
        {MEAL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setMealFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-heading font-semibold whitespace-nowrap transition-colors border rounded-full ${
              mealFilter === f.value
                ? 'bg-miso/20 text-miso border-miso/50'
                : 'bg-rift text-text-muted border-nebula hover:border-miso/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Diversity stats */}
      <WeekStats weekMenu={weekMenu} />

      {/* Freezer alerts */}
      {alerts.map((alert) => (
        <AlertBanner key={alert.itemId || alert.message} type={alert.type} message={alert.message} className="mb-3" />
      ))}

      {/* Hint: обновить список покупок после смены блюд */}
      {weekMenu && (
        <p className="text-xs text-text-muted mb-3">
          После смены блюд{' '}
          <Link to="/shopping" className="text-portal hover:underline">
            обновите список покупок
          </Link>
          .
        </p>
      )}

      {/* Days with accordion MealSlots */}
      <div className="space-y-4">
        {filteredDays.map((day, dayIdx) => {
          const dateObj = new Date(day.date);
          const shortCode = DAY_SHORT_CODES[day.dayOfWeek] || 'DAY';
          const sectorNum = dayIdx + 1;

          return (
            <div key={day.date} className="bg-panel border border-elevated rounded-card shadow-card animate-card-appear overflow-hidden">
              {/* Day header with sector label */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-mono text-portal-dim tracking-[1.5px] mb-0.5">
                      DIM-{shortCode} · SECTOR {sectorNum}
                    </span>
                    <h2 className="font-heading font-extrabold text-text-primary text-lg leading-tight">
                      {day.dayOfWeek}
                    </h2>
                    <span className="text-xs font-body text-text-muted">
                      {dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <span className="text-2xl">📅</span>
                </div>
              </div>

              {/* Meals inside a card container with accordion */}
              <div className="mx-3 mb-3 bg-card border border-elevated rounded-card overflow-hidden">
                {day.meals.map((meal, index) => {
                  const mealTypeLabel = MEAL_FILTERS.find(f => f.value === meal.mealType)?.label || meal.mealType;
                  const fullDay = weekMenu.days.find((d) => d.date === day.date);
                  const realMealIndex = fullDay?.meals.findIndex((m) => m.mealType === meal.mealType) ?? index;
                  return (
                    <div key={`${day.date}-${meal.mealType}-${index}`}>
                      {mealFilter === 'all' && (
                        <div className="px-4 pt-2 pb-1">
                          <span className="text-[10px] font-mono text-portal-dim tracking-[1.5px] uppercase">
                            {mealTypeLabel.replace(/[^\w\s]/g, '').trim()}
                          </span>
                        </div>
                      )}
                      <MealSlot
                        slot={meal}
                        date={day.date}
                        onUpdate={(updated) => handleMealSlotUpdate(day.date, realMealIndex, updated)}
                        onRequestSwap={(recipeIndexInSlot) =>
                          setSwapTarget({ dayDate: day.date, mealIndex: realMealIndex, recipeIndexInSlot })
                        }
                        isExpanded={expandedMeals[day.date] === realMealIndex}
                        onToggle={() => handleToggleMeal(day.date, realMealIndex)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredDays.length === 0 && (
          <div className="bg-panel border border-elevated rounded-card p-5 text-center">
            <p className="text-text-muted font-body text-sm">Нет блюд по этому фильтру</p>
          </div>
        )}
      </div>

      {/* Single swap modal at page level — avoids click/stacking issues inside accordion */}
      {swapTarget && weekMenu && (() => {
        const day = weekMenu.days.find((d) => d.date === swapTarget.dayDate);
        const slot = day?.meals[swapTarget.mealIndex];
        const entry = slot?.recipes[swapTarget.recipeIndexInSlot];
        return (
          <SwapModal
            isOpen={true}
            onClose={() => setSwapTarget(null)}
            onSelect={handleSwapSelect}
            currentRecipeId={entry?.recipeId}
            filterForWhom={entry?.forWhom}
            filterMealType={slot?.mealType}
          />
        );
      })()}
    </div>
  );
}

// default export for React.lazy()
export default MenuPage;

import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { WeekMenu, FreezerItem, EquipmentId } from '../data/schema';
import { useBatchCooking } from '../hooks/useBatchCooking';
import { nanoid } from 'nanoid';
import { CheckCircle2, Clock, ChefHat, Snowflake, Play, BarChart3 } from 'lucide-react';

const EQUIPMENT_LABELS: Record<EquipmentId, string> = {
  stove: '🔥 Плита', oven: '🔲 Духовка', 'air-grill': '🌀 Аэрогриль', 'e-grill': '⚡ Электрогриль',
  steamer: '♨️ Пароварка', blender: '🥤 Блендер', mixer: '🎛️ Миксер', grinder: '🔧 Гриндер',
  vacuum: '📦 Вакууматор', bowls: '🥣 Миски',
};

const EQUIPMENT_COLORS: Record<string, string> = {
  stove: 'bg-ramen/30', oven: 'bg-miso/30', 'air-grill': 'bg-portal/30', 'e-grill': 'bg-portal/30',
  steamer: 'bg-frost/30', blender: 'bg-matcha/30', mixer: 'bg-plasma/30', grinder: 'bg-ramen/20',
  vacuum: 'bg-frost/20', bowls: 'bg-nebula',
};

const PHASE_LABELS: Record<number, string> = {
  1: 'ФАРШ',
  2: 'ПАРАЛ.',
  3: 'ПЮРЕ',
  4: 'УПАКОВКА',
};

/** Simple parallel detection: tasks in phases 1-3 that share equipment time slots */
function canRunParallel(taskIndex: number, phaseTasks: { equipment: string; duration: number }[]): boolean {
  if (phaseTasks.length <= 1) return false;
  const task = phaseTasks[taskIndex];
  // A task can run in parallel if there's another task in the same phase using different equipment
  return phaseTasks.some((t, i) => i !== taskIndex && t.equipment !== task.equipment);
}

/** Generate a tip for a task based on context */
function generateTip(taskIndex: number, phaseTasks: { equipment: string; step: string; recipeTitle: string }[]): string | null {
  const task = phaseTasks[taskIndex];
  const othersWithDiffEquipment = phaseTasks.filter((t, i) => i !== taskIndex && t.equipment !== task.equipment);
  if (othersWithDiffEquipment.length > 0 && taskIndex === 0) {
    return `Пока ${task.step.toLowerCase().slice(0, 30)}... — ${othersWithDiffEquipment[0].step.toLowerCase().slice(0, 40)}`;
  }
  return null;
}

export function PrepPage() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const { plan, loading: planLoading, generateBatchPlan, toggleTask } = useBatchCooking();

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const menu = await dataService.menus.getCurrent().catch(() => null);
      setWeekMenu(menu || null);
    } catch (error) {
      logger.error('[PrepPage] Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!weekMenu) return;
    logger.log('[PrepPage] Generating batch plan...');
    await generateBatchPlan(weekMenu);
  }

  async function handleFreezeCompleted() {
    if (!plan) return;
    const packagingTasks = plan.tasks.filter(t => t.completed && t.phase === 4);
    const allRecipes = await dataService.recipes.list();
    const recipeMap = new Map(
      allRecipes.filter((r) => packagingTasks.some((t) => t.recipeId === r.id)).map((r) => [r.id, r])
    );

    for (const task of packagingTasks) {
      const recipe = recipeMap.get(task.recipeId);
      const freezerMonths = recipe?.storage?.freezer ?? 3;
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + freezerMonths);

      const createFreezerItem = (portions: number, forWhom?: 'kolya' | 'kristina' | 'both'): FreezerItem => ({
        id: nanoid(),
        recipeId: task.recipeId,
        name: task.recipeTitle,
        portions,
        portionsRemaining: portions,
        portionsOriginal: portions,
        batchId: plan.id,
        frozenDate: now.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        ...(forWhom && { forWhom }),
      });

      if (task.portionsByMember && (task.portionsByMember.kolya > 0 || task.portionsByMember.kristina > 0)) {
        // Create personalized packets
        if (task.portionsByMember.kolya > 0) {
          const item = createFreezerItem(task.portionsByMember.kolya, 'kolya');
          await dataService.freezer.create(item);
        }
        if (task.portionsByMember.kristina > 0) {
          const item = createFreezerItem(task.portionsByMember.kristina, 'kristina');
          await dataService.freezer.create(item);
        }
      } else {
        const freezerItems = await dataService.freezer.list();
        const existing = freezerItems.find((i) => i.recipeId === task.recipeId);
        if (existing && !existing.forWhom) {
          await dataService.freezer.update(existing.id, {
            portionsRemaining: existing.portionsRemaining + task.portions,
            portionsOriginal: existing.portionsOriginal + task.portions,
          });
        } else {
          const newItem = createFreezerItem(task.portions, 'both');
          await dataService.freezer.create(newItem);
        }
      }
    }
    logger.log(`[PrepPage] Frozen ${packagingTasks.length} items`);
  }

  if (loading || planLoading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-panel border border-elevated rounded-card p-4">
          <div className="text-text-secondary font-body">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!weekMenu) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-panel border border-elevated rounded-card p-6 text-center shadow-card">
          <ChefHat className="w-10 h-10 text-portal/30 mx-auto mb-3" />
          <div className="text-[10px] font-mono text-text-ghost tracking-widest mb-1">準備プランなし</div>
          <p className="text-text-secondary font-body">Сначала создайте меню на неделю</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-portal" /> Заготовки выходного дня
        </h1>
        <div className="bg-panel border border-elevated rounded-card p-6 text-center shadow-card">
          <div className="text-[10px] font-mono text-text-ghost tracking-widest mb-1">準備プランなし</div>
          <p className="text-text-secondary font-body mb-4">
            Нажмите чтобы сгенерировать план заготовок на основе меню недели
          </p>
          <button onClick={handleGenerate}
            className="px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow hover:shadow-glow/80 transition-all flex items-center gap-2 mx-auto">
            <Play className="w-5 h-5" /> Создать план заготовок
          </button>
        </div>
      </div>
    );
  }

  const phases = [1, 2, 3, 4] as const;
  const completedCount = plan.completedTasks.length;
  const totalCount = plan.tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Equipment timeline data
  const equipmentUsage = new Map<string, { equipment: string; totalMinutes: number }>();
  for (const task of plan.tasks) {
    const key = task.equipment;
    const existing = equipmentUsage.get(key);
    if (existing) {
      existing.totalMinutes += task.duration;
    } else {
      equipmentUsage.set(key, { equipment: key, totalMinutes: task.duration });
    }
  }
  const maxEquipmentTime = Math.max(...Array.from(equipmentUsage.values()).map(e => e.totalMinutes));

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <h1 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
        <ChefHat className="w-6 h-6 text-portal" /> Заготовки выходного дня
      </h1>

      {/* Summary card with progress */}
      <div className="bg-panel border border-elevated rounded-card p-4 mb-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading font-semibold text-text-primary">Прогресс</span>
          <span className="text-xs font-mono text-portal">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full h-3 bg-rift rounded-sm overflow-hidden mb-3">
          <div className="h-full bg-portal rounded-sm transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex items-center gap-4 text-xs font-body text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~{plan.totalTime} мин
          </span>
          <span className="flex items-center gap-1">
            <Snowflake className="w-3.5 h-3.5 text-frost" />
            {plan.tasks.filter(t => t.phase === 4).length} заготовок
          </span>
        </div>
      </div>

      {/* Equipment timeline */}
      <div className="bg-panel border border-elevated rounded-card p-4 mb-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-portal" />
          <span className="text-sm font-heading font-semibold text-text-primary">Загрузка оборудования</span>
        </div>
        <div className="space-y-1.5">
          {Array.from(equipmentUsage.values())
            .sort((a, b) => b.totalMinutes - a.totalMinutes)
            .map(e => (
              <div key={e.equipment} className="flex items-center gap-2">
                <span className="text-xs font-body text-text-muted w-24 text-right">
                  {EQUIPMENT_LABELS[e.equipment as EquipmentId] || e.equipment}
                </span>
                <div className="flex-1 h-4 bg-rift rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${EQUIPMENT_COLORS[e.equipment] || 'bg-portal/30'}`}
                    style={{ width: `${(e.totalMinutes / maxEquipmentTime) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-secondary w-12 text-right">{e.totalMinutes} м</span>
              </div>
            ))}
        </div>
      </div>

      {/* Task cards by phase with sector labels */}
      {phases.map(phase => {
        const phaseTasks = plan.tasks.filter(t => t.phase === phase);
        if (phaseTasks.length === 0) return null;
        const phaseLabel = phaseTasks[0]?.phaseLabel || `Фаза ${phase}`;
        const phaseCompleted = phaseTasks.filter(t => t.completed).length;

        return (
          <div key={phase} className="mb-5">
            {/* Phase header with sector label + counter */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-mono text-portal-dim tracking-[1.5px]">
                  ЧАС {phase} · {PHASE_LABELS[phase] || 'ФАЗА'}
                </span>
                <h2 className="font-heading font-bold text-text-primary text-base">{phaseLabel}</h2>
              </div>
              <span className="text-xs font-mono bg-portal/12 text-portal px-2.5 py-1 rounded-pill border border-portal/20">
                {phaseCompleted}/{phaseTasks.length}
              </span>
            </div>

            {/* Phase progress bar */}
            <div className="w-full h-1.5 bg-rift rounded-sm overflow-hidden mb-3">
              <div
                className="h-full bg-portal rounded-sm transition-all"
                style={{ width: `${phaseTasks.length > 0 ? (phaseCompleted / phaseTasks.length) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-2">
              {phaseTasks.map((task, taskIdx) => {
                const isParallel = canRunParallel(taskIdx, phaseTasks);
                const tip = generateTip(taskIdx, phaseTasks);

                return (
                  <div key={task.id}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-full text-left p-3 rounded-card border transition-all ${
                        task.completed
                          ? 'bg-rift border-portal/30 opacity-50'
                          : 'bg-card border-elevated hover:border-portal/30'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-portal flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-md border border-elevated flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-heading font-medium ${task.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                            {task.step}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono text-text-muted">{task.recipeTitle}</span>
                            <span className="text-[10px] font-mono text-accent-orange">{task.duration} мин</span>
                            <span className={`text-[10px] px-1.5 py-0.5 border rounded ${EQUIPMENT_COLORS[task.equipment] || 'bg-rift'} border-elevated text-text-secondary`}>
                              {EQUIPMENT_LABELS[task.equipment] || task.equipment}
                            </span>
                            {isParallel && (
                              <span className="text-[10px] font-mono text-accent-cyan">⚡ парал.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Green tip block */}
                    {tip && !task.completed && (
                      <div className="ml-8 mt-1 px-3 py-2 bg-portal-soft border-l-2 border-portal rounded text-xs text-portal font-body">
                        💡 {tip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Freeze button */}
      {completedCount > 0 && (
        <button onClick={handleFreezeCompleted}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-frost to-frost/70 text-void font-heading font-semibold rounded-button flex items-center justify-center gap-2">
          <Snowflake className="w-5 h-5" /> Заморозить готовое
        </button>
      )}
    </div>
  );
}

// default export for React.lazy()
export default PrepPage;

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { WeekMenu, FreezerItem, EquipmentId } from '../data/schema';
import { useBatchCooking } from '../hooks/useBatchCooking';
import { nanoid } from 'nanoid';
import { CheckCircle2, Circle, Clock, ChefHat, Snowflake, Play, BarChart3 } from 'lucide-react';

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

export default function PrepPage() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const { plan, loading: planLoading, generateBatchPlan, toggleTask } = useBatchCooking();

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const menu = await db.table('menus').orderBy('createdAt').last();
      setWeekMenu(menu || null);
    } catch (error) {
      console.error('[PrepPage] Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!weekMenu) return;
    console.log('[PrepPage] Generating batch plan...');
    await generateBatchPlan(weekMenu);
  }

  async function handleFreezeCompleted() {
    if (!plan) return;
    // Find completed packaging tasks and create FreezerItems
    const packagingTasks = plan.tasks.filter(t => t.completed && t.phase === 4);
    for (const task of packagingTasks) {
      const existing = await db.table('freezer').where('recipeId').equals(task.recipeId).first();
      if (existing) {
        // Add portions to existing
        await db.table('freezer').update(existing.id, {
          portionsRemaining: existing.portionsRemaining + task.portions,
          portionsOriginal: existing.portionsOriginal + task.portions,
        });
      } else {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 3);
        const newItem: FreezerItem = {
          id: nanoid(),
          recipeId: task.recipeId,
          name: task.recipeTitle,
          portions: task.portions,
          portionsRemaining: task.portions,
          portionsOriginal: task.portions,
          batchId: plan.id,
          frozenDate: now.toISOString().split('T')[0],
          expiryDate: expiry.toISOString().split('T')[0],
        };
        await db.table('freezer').add(newItem);
      }
    }
    console.log(`[PrepPage] Frozen ${packagingTasks.length} items`);
  }

  if (loading || planLoading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!weekMenu) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-6 text-center shadow-card">
          <ChefHat className="w-10 h-10 text-portal/30 mx-auto mb-3" />
          <p className="text-text-mid font-body">Сначала создайте меню на неделю</p>
        </div>
      </div>
    );
  }

  // If no plan yet, show generate button
  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <h1 className="font-heading text-2xl font-bold text-text-light mb-6 flex items-center" style={{ gap: '8px' }}>
          <ChefHat className="w-6 h-6 text-portal" /> Заготовки выходного дня
        </h1>
        <div className="bg-dimension border border-nebula rounded-card p-6 text-center shadow-card">
          <p className="text-text-mid font-body mb-4">
            Нажмите чтобы сгенерировать план заготовок на основе меню недели
          </p>
          <button onClick={handleGenerate}
            className="px-6 py-3 bg-gradient-to-r from-portal to-portal-dim text-void font-heading font-semibold rounded-button shadow-glow hover:shadow-glow/80 transition-all flex items-center mx-auto"
            style={{ gap: '8px' }}>
            <Play className="w-5 h-5" /> Создать план заготовок
          </button>
        </div>
      </div>
    );
  }

  // Plan exists — show task cards grouped by phase
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
      <h1 className="font-heading text-2xl font-bold text-text-light mb-4 flex items-center" style={{ gap: '8px' }}>
        <ChefHat className="w-6 h-6 text-portal" /> Заготовки выходного дня
      </h1>

      {/* Summary card */}
      <div className="bg-dimension border border-nebula rounded-card p-4 mb-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading font-semibold text-text-light">Прогресс</span>
          <span className="text-xs font-mono text-portal">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full h-3 bg-rift rounded-sm overflow-hidden mb-3">
          <div className="h-full bg-portal rounded-sm transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex items-center text-xs font-body text-text-dim" style={{ gap: '16px' }}>
          <span className="flex items-center" style={{ gap: '4px' }}>
            <Clock className="w-3.5 h-3.5" /> ~{plan.totalTime} мин
          </span>
          <span className="flex items-center" style={{ gap: '4px' }}>
            <Snowflake className="w-3.5 h-3.5 text-frost" />
            {plan.tasks.filter(t => t.phase === 4).length} заготовок
          </span>
        </div>
      </div>

      {/* Equipment timeline */}
      <div className="bg-dimension border border-nebula rounded-card p-4 mb-4 shadow-card">
        <div className="flex items-center mb-3" style={{ gap: '8px' }}>
          <BarChart3 className="w-4 h-4 text-portal" />
          <span className="text-sm font-heading font-semibold text-text-light">Загрузка оборудования</span>
        </div>
        <div className="space-y-1.5">
          {Array.from(equipmentUsage.values())
            .sort((a, b) => b.totalMinutes - a.totalMinutes)
            .map(e => (
              <div key={e.equipment} className="flex items-center" style={{ gap: '8px' }}>
                <span className="text-xs font-body text-text-dim w-24 text-right">
                  {EQUIPMENT_LABELS[e.equipment as EquipmentId] || e.equipment}
                </span>
                <div className="flex-1 h-4 bg-rift rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${EQUIPMENT_COLORS[e.equipment] || 'bg-portal/30'}`}
                    style={{ width: `${(e.totalMinutes / maxEquipmentTime) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-mid w-12 text-right">{e.totalMinutes} м</span>
              </div>
            ))}
        </div>
      </div>

      {/* Task cards by phase */}
      {phases.map(phase => {
        const phaseTasks = plan.tasks.filter(t => t.phase === phase);
        if (phaseTasks.length === 0) return null;
        const phaseLabel = phaseTasks[0]?.phaseLabel || `Фаза ${phase}`;
        return (
          <div key={phase} className="mb-4">
            <h2 className="font-heading font-semibold text-text-light text-sm mb-2">{phaseLabel}</h2>
            <div className="space-y-2">
              {phaseTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full text-left p-3 rounded-card border transition-all ${
                    task.completed
                      ? 'bg-rift border-portal/30 opacity-60'
                      : 'bg-dimension border-nebula hover:border-portal/30'
                  }`}
                >
                  <div className="flex items-start" style={{ gap: '10px' }}>
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-portal flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-text-ghost flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center" style={{ gap: '6px' }}>
                        <span className={`text-sm font-body ${task.completed ? 'text-text-dim line-through' : 'text-text-light'}`}>
                          {task.step}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-[10px] font-body text-text-dim" style={{ gap: '10px' }}>
                        <span>{task.recipeTitle}</span>
                        <span className="font-mono">{task.duration} мин</span>
                        <span>{task.portions} порц.</span>
                        <span className={`px-1.5 py-0.5 border text-text-dim ${EQUIPMENT_COLORS[task.equipment] || 'bg-rift'} border-nebula`}
                          style={{ borderRadius: '4px' }}>
                          {EQUIPMENT_LABELS[task.equipment] || task.equipment}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Freeze button */}
      {completedCount > 0 && (
        <button onClick={handleFreezeCompleted}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-frost to-frost/70 text-void font-heading font-semibold rounded-button flex items-center justify-center"
          style={{ gap: '8px' }}>
          <Snowflake className="w-5 h-5" /> Заморозить готовое
        </button>
      )}
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import { db } from '../lib/db';
import type { WeekMenu, Recipe, BatchTask, BatchPlan, EquipmentId } from '../data/schema';
import { nanoid } from 'nanoid';

/** Phase labels for batch cooking workflow */
const PHASE_LABELS: Record<number, string> = {
  1: 'Час 1: Фарш и формовка',
  2: 'Час 2: Плита и духовка',
  3: 'Час 3: Блендер и пюре',
  4: 'Час 4: Упаковка и заморозка',
};

/** Determine which phase an equipment belongs to */
function getPhaseForEquipment(equipment: EquipmentId): 1 | 2 | 3 | 4 {
  switch (equipment) {
    case 'grinder':
    case 'mixer':
    case 'bowls':
      return 1;
    case 'stove':
    case 'oven':
    case 'air-grill':
    case 'e-grill':
    case 'steamer':
      return 2;
    case 'blender':
      return 3;
    case 'vacuum':
      return 4;
    default:
      return 2;
  }
}

export function useBatchCooking() {
  const [plan, setPlan] = useState<BatchPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const latest = await db.batchPlans.orderBy('date').reverse().first();
        if (!cancelled && latest) {
          setPlan(latest);
          logger.log('[useBatchCooking] Loaded saved plan:', latest.id);
        }
      } catch (e) {
        logger.error('[useBatchCooking] Load saved plan:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const generateBatchPlan = useCallback(async (weekMenu: WeekMenu): Promise<BatchPlan | null> => {
    setLoading(true);
    try {
      // 1. Collect all recipe IDs from menu
      const recipeIds = new Set<string>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            recipeIds.add(entry.recipeId);
          }
        }
      }

      // 2. Load recipes
      const allRecipes = await dataService.recipes.list();
      const recipeMap = new Map<string, Recipe>();
      for (const r of allRecipes) {
        if (recipeIds.has(r.id)) recipeMap.set(r.id, r);
      }

      // 3. Filter to freezable recipes
      const freezableRecipes = Array.from(recipeMap.values()).filter(
        r => r.tags.includes('freezable') || r.tags.includes('prep-day') || r.tags.includes('batch-cooking')
      );

      if (freezableRecipes.length === 0) {
        logger.log('[useBatchCooking] No freezable recipes found in menu');
        setLoading(false);
        // Show message to user - but don't return null immediately, let them know
        return null;
      }

      logger.log(`[useBatchCooking] Found ${freezableRecipes.length} freezable recipes`);

      // 4. Check freezer inventory
      const freezerItems = await dataService.freezer.list();
      const freezerStock = new Map<string, number>();
      for (const fi of freezerItems) {
        if (fi.portionsRemaining > 0 && fi.recipeId) {
          freezerStock.set(fi.recipeId, (freezerStock.get(fi.recipeId) || 0) + fi.portionsRemaining);
        }
      }

      // 5. Calculate needed portions and portions by member (for personalized packets)
      const recipeUsageCount = new Map<string, number>();
      const recipeUsageByMember = new Map<string, { kolya: number; kristina: number }>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            const rid = entry.recipeId;
            recipeUsageCount.set(rid, (recipeUsageCount.get(rid) || 0) + 1);
            const byMember = recipeUsageByMember.get(rid) || { kolya: 0, kristina: 0 };
            if (entry.forWhom === 'kolya') byMember.kolya += 1;
            else if (entry.forWhom === 'kristina') byMember.kristina += 1;
            else if (entry.forWhom === 'both') {
              byMember.kolya += 1;
              byMember.kristina += 1;
            }
            recipeUsageByMember.set(rid, byMember);
          }
        }
      }

      // 6. Generate tasks
      const tasks: BatchTask[] = [];
      for (const recipe of freezableRecipes) {
        const usageCount = recipeUsageCount.get(recipe.id) || 1;
        const stockPortions = freezerStock.get(recipe.id) || 0;
        const neededPortions = Math.max(0, recipe.servings * usageCount - stockPortions);

        if (neededPortions <= 0) {
          logger.log(`[useBatchCooking] ${recipe.title}: stock covers needed portions`);
          continue;
        }

        // Create tasks from recipe steps
        for (const step of recipe.steps) {
          const eq = step.equipment?.id || recipe.equipment[0] || 'bowls';
          const phase = getPhaseForEquipment(eq);
          tasks.push({
            id: nanoid(),
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            phase,
            phaseLabel: PHASE_LABELS[phase],
            equipment: eq,
            step: step.text,
            duration: step.duration || 10,
            portions: neededPortions,
            completed: false,
          });
        }

        // Add packaging step (with blanch reminder for vegetable prep)
        const needsBlanchCool = recipe.tags.includes('blanch-before-freeze') && recipe.storage.vacuumSealed;
        const packagingStep = needsBlanchCool
          ? `Охладить полностью! Упаковать ${recipe.title} по порциям (Коля/Кристина) и заморозить`
          : `Упаковать ${recipe.title} по ${neededPortions} порций и заморозить`;
        const byMember = recipeUsageByMember.get(recipe.id);
        const totalMemberSlots = byMember ? byMember.kolya + byMember.kristina : 0;
        const portionsByMember =
          byMember && totalMemberSlots > 0
            ? {
                kolya: Math.round(neededPortions * byMember.kolya / totalMemberSlots),
                kristina: neededPortions - Math.round(neededPortions * byMember.kolya / totalMemberSlots),
              }
            : undefined;
        tasks.push({
          id: nanoid(),
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          phase: 4,
          phaseLabel: PHASE_LABELS[4],
          equipment: recipe.storage.vacuumSealed ? 'vacuum' : 'bowls',
          step: packagingStep,
          duration: needsBlanchCool ? 10 : 5,
          portions: neededPortions,
          portionsByMember,
          completed: false,
        });
      }

      // Sort by phase, then by equipment
      tasks.sort((a, b) => a.phase - b.phase || a.equipment.localeCompare(b.equipment));

      const totalTime = tasks.reduce((sum, t) => sum + t.duration, 0);

      const newPlan: BatchPlan = {
        id: nanoid(),
        date: new Date().toISOString().split('T')[0],
        tasks,
        totalTime,
        completedTasks: [],
      };

      logger.log(`[useBatchCooking] Generated plan: ${tasks.length} tasks, ~${totalTime} min`);
      await db.batchPlans.put(newPlan);
      setPlan(newPlan);
      setLoading(false);
      logger.log('[useBatchCooking] Plan saved and state updated');
      return newPlan;
    } catch (error) {
      logger.error('[useBatchCooking] Error generating plan:', error);
      setLoading(false);
      return null;
    }
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const isCompleted = prev.completedTasks.includes(taskId);
      const completedTasks = isCompleted
        ? prev.completedTasks.filter(id => id !== taskId)
        : [...prev.completedTasks, taskId];
      const tasks = prev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      const next = { ...prev, tasks, completedTasks };
      db.batchPlans.put(next).catch(e => logger.error('[useBatchCooking] Save after toggle:', e));
      return next;
    });
  }, []);

  return { plan, loading, generateBatchPlan, toggleTask };
}

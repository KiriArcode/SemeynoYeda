import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import type { WeekMenu, Recipe, FreezerItem, BatchTask, BatchPlan, EquipmentId } from '../data/schema';
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
  const [loading, setLoading] = useState(false);

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
      const recipes = await db.table('recipes').bulkGet(Array.from(recipeIds));
      const recipeMap = new Map<string, Recipe>();
      for (const r of recipes) {
        if (r) recipeMap.set(r.id, r);
      }

      // 3. Filter to freezable recipes
      const freezableRecipes = Array.from(recipeMap.values()).filter(
        r => r.tags.includes('freezable') || r.tags.includes('prep-day')
      );

      if (freezableRecipes.length === 0) {
        console.log('[useBatchCooking] No freezable recipes found');
        setLoading(false);
        return null;
      }

      // 4. Check freezer inventory
      const freezerItems = await db.table('freezer').toArray() as FreezerItem[];
      const freezerStock = new Map<string, number>();
      for (const fi of freezerItems) {
        if (fi.portionsRemaining > 0 && fi.recipeId) {
          freezerStock.set(fi.recipeId, (freezerStock.get(fi.recipeId) || 0) + fi.portionsRemaining);
        }
      }

      // 5. Calculate needed portions (count how many times each recipe appears in menu)
      const recipeUsageCount = new Map<string, number>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            recipeUsageCount.set(entry.recipeId, (recipeUsageCount.get(entry.recipeId) || 0) + 1);
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
          console.log(`[useBatchCooking] ${recipe.title}: stock covers needed portions`);
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

        // Add packaging step
        tasks.push({
          id: nanoid(),
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          phase: 4,
          phaseLabel: PHASE_LABELS[4],
          equipment: recipe.storage.vacuumSealed ? 'vacuum' : 'bowls',
          step: `Упаковать ${recipe.title} по ${neededPortions} порций и заморозить`,
          duration: 5,
          portions: neededPortions,
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

      console.log(`[useBatchCooking] Generated plan: ${tasks.length} tasks, ~${totalTime} min`);
      setPlan(newPlan);
      setLoading(false);
      return newPlan;
    } catch (error) {
      console.error('[useBatchCooking] Error generating plan:', error);
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
      return { ...prev, tasks, completedTasks };
    });
  }, []);

  return { plan, loading, generateBatchPlan, toggleTask };
}

import { useState, useCallback, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import { db } from '../lib/db';
import type { WeekMenu, Recipe, BatchTask, BatchPlan, EquipmentId, NestingLevel } from '../data/schema';
import { nanoid } from 'nanoid';
import { findRecipeByIngredientName } from '../lib/recipeNesting';
import { getPortionsPerRecipeFromMenu } from '../lib/shoppingListUtils';

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

      // 3. Level 1: from menu — freezable, prep-day, batch-cooking, sauces
      const freezableRecipes = Array.from(recipeMap.values()).filter(
        r => r.tags.includes('freezable') || r.tags.includes('prep-day') || r.tags.includes('batch-cooking')
      );
      const saucesL1 = Array.from(recipeMap.values()).filter(
        r => r.category === 'sauce' && (r.tags.includes('freezable') || r.tags.includes('prep-day'))
      );
      const level1Recipes = new Set<Recipe>([...freezableRecipes, ...saucesL1]);

      // 3b. Level 2: components of level 1 (бульоны, соусы — ингредиенты рецептов меню)
      const level2Recipes = new Set<Recipe>();
      for (const recipe of level1Recipes) {
        for (const ingredient of recipe.ingredients) {
          const comp = findRecipeByIngredientName(ingredient.name, allRecipes);
          if (
            comp &&
            (comp.tags.includes('prep-day') ||
             comp.tags.includes('freezable') ||
             comp.category === 'sauce' ||
             comp.category === 'soup')
          ) {
            level2Recipes.add(comp);
          }
        }
      }

      // 3c. Level 3: components of level 2 (напр. бульон внутри соуса)
      const level3Recipes = new Set<Recipe>();
      for (const recipe of level2Recipes) {
        for (const ingredient of recipe.ingredients) {
          const comp = findRecipeByIngredientName(ingredient.name, allRecipes);
          if (
            comp &&
            (comp.tags.includes('prep-day') ||
             comp.tags.includes('freezable') ||
             comp.category === 'sauce' ||
             comp.category === 'soup')
          ) {
            level3Recipes.add(comp);
          }
        }
      }

      const recipeToLevel = new Map<string, NestingLevel>();
      level1Recipes.forEach(r => recipeToLevel.set(r.id, 1));
      level2Recipes.forEach(r => recipeToLevel.set(r.id, 2));
      level3Recipes.forEach(r => recipeToLevel.set(r.id, 3));

      const allPrepRecipes = new Set<Recipe>([...level1Recipes, ...level2Recipes, ...level3Recipes]);
      const prepRecipesArray = Array.from(allPrepRecipes);

      if (prepRecipesArray.length === 0) {
        logger.log('[useBatchCooking] No recipes for prep found in menu');
        setLoading(false);
        return null;
      }

      logger.log(`[useBatchCooking] Found ${prepRecipesArray.length} recipes for prep (L1: ${level1Recipes.size}, L2: ${level2Recipes.size}, L3: ${level3Recipes.size})`);

      // 4. Check freezer inventory
      const freezerItems = await dataService.freezer.list();
      const freezerStock = new Map<string, number>();
      for (const fi of freezerItems) {
        if (fi.portionsRemaining > 0 && fi.recipeId) {
          freezerStock.set(fi.recipeId, (freezerStock.get(fi.recipeId) || 0) + fi.portionsRemaining);
        }
      }

      // 5. Portions by forWhom (kolya/kristina = 1, both = 2) and by member for packets
      const portionsByRecipe = getPortionsPerRecipeFromMenu(weekMenu);
      console.log('[useBatchCooking] portionsByRecipe', Object.fromEntries(portionsByRecipe));
      logger.log('[useBatchCooking] portionsByRecipe', Object.fromEntries(portionsByRecipe));

      const recipeUsageByMember = new Map<string, { kolya: number; kristina: number }>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            const rid = entry.recipeId;
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
      console.log('[useBatchCooking] recipeUsageByMember (slots)', Array.from(recipeUsageByMember.entries()).map(([id, m]) => ({ id, ...m })));
      logger.log('[useBatchCooking] recipeUsageByMember (slots)', Array.from(recipeUsageByMember.entries()).map(([id, m]) => ({ id, ...m })));

      // 6. Generate tasks
      const tasks: BatchTask[] = [];
      for (const recipe of prepRecipesArray) {
        const menuPortions = portionsByRecipe.get(recipe.id) ?? 0;
        const stockPortions = freezerStock.get(recipe.id) || 0;
        const neededPortions = Math.max(0, menuPortions - stockPortions);
        console.log('[useBatchCooking] portions', {
          recipeId: recipe.id,
          title: recipe.title,
          menuPortions,
          stockPortions,
          neededPortions,
        });
        logger.log('[useBatchCooking] portions', {
          recipeId: recipe.id,
          title: recipe.title,
          menuPortions,
          stockPortions,
          neededPortions,
        });

        if (neededPortions <= 0) {
          logger.log(`[useBatchCooking] ${recipe.title}: stock covers needed portions`);
          continue;
        }

        const nestingLevel = recipeToLevel.get(recipe.id) ?? 1;
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
            nestingLevel,
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
          nestingLevel,
        });
      }

      // Sort by phase, then by equipment
      tasks.sort((a, b) => a.phase - b.phase || a.equipment.localeCompare(b.equipment));

      // Бульоны: всегда добавляем задачу на 1 л каждого типа бульона
      const brothRecipes = allRecipes.filter(
        (r) => r.category === 'soup' || r.title.toLowerCase().includes('бульон')
      );
      for (const recipe of brothRecipes) {
        const alreadyHasBrothTask = tasks.some(
          (t) => t.recipeId === recipe.id && t.step.toLowerCase().includes('1 л')
        );
        if (alreadyHasBrothTask) continue;
        tasks.push({
          id: nanoid(),
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          phase: 2,
          phaseLabel: PHASE_LABELS[2],
          equipment: 'stove',
          step: `Сварить 1 л ${recipe.title}`,
          duration: 60,
          portions: 1,
          completed: false,
          nestingLevel: 1,
        });
        console.log('[useBatchCooking] Added 1L broth task:', recipe.title);
        logger.log(`[useBatchCooking] Added 1L broth task: ${recipe.title}`);
      }
      tasks.sort((a, b) => a.phase - b.phase || a.equipment.localeCompare(b.equipment));

      const newRecipeIds = new Set(tasks.map(t => t.recipeId));
      const completedTasks: string[] = [];
      const orphanTasks: BatchTask[] = [];

      const oldPlan = await db.batchPlans.orderBy('date').reverse().first();
      if (oldPlan?.completedTasks?.length) {
        const oldCompletedByRecipe = new Map<string, boolean>();
        for (const task of oldPlan.tasks) {
          if (task.completed || oldPlan.completedTasks.includes(task.id)) {
            oldCompletedByRecipe.set(task.recipeId, true);
          }
        }
        const newRecipeIdsMarkedCompleted = new Set<string>();
        for (const task of oldPlan.tasks) {
          const wasCompleted = task.completed || oldPlan.completedTasks.includes(task.id);
          if (!wasCompleted) continue;
          if (newRecipeIds.has(task.recipeId)) {
            if (!newRecipeIdsMarkedCompleted.has(task.recipeId)) {
              newRecipeIdsMarkedCompleted.add(task.recipeId);
              const newTaskIdsForRecipe = tasks.filter(t => t.recipeId === task.recipeId).map(t => t.id);
              completedTasks.push(...newTaskIdsForRecipe);
            }
          } else {
            orphanTasks.push({
              ...task,
              id: task.id,
              isOrphan: true,
            });
            completedTasks.push(task.id);
          }
        }
      }

      const dedupCompleted = Array.from(new Set(completedTasks));
      for (const t of tasks) {
        if (dedupCompleted.includes(t.id)) t.completed = true;
      }
      const finalTasks = [...tasks, ...orphanTasks];
      const totalTime = finalTasks.reduce((sum, t) => sum + t.duration, 0);

      const newPlan: BatchPlan = {
        id: nanoid(),
        date: new Date().toISOString().split('T')[0],
        weekStart: weekMenu.weekStart,
        tasks: finalTasks,
        totalTime,
        completedTasks: dedupCompleted,
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

  const removeOrphanTask = useCallback((taskId: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task?.isOrphan) return prev;
      const tasks = prev.tasks.filter(t => t.id !== taskId);
      const completedTasks = prev.completedTasks.filter(id => id !== taskId);
      const next = { ...prev, tasks, completedTasks };
      db.batchPlans.put(next).catch(e => logger.error('[useBatchCooking] Save after removeOrphan:', e));
      return next;
    });
  }, []);

  return { plan, loading, generateBatchPlan, toggleTask, removeOrphanTask };
}

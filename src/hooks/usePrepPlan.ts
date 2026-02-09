import { useState } from 'react';
import { dataService } from '../lib/dataService';
import type { Recipe, PrepPlan, PrepTask } from '../data/schema';
import { nanoid } from 'nanoid';

const PREP_ACTIONS = {
  chop: 'нарезать',
  slice: 'нарезать ломтиками',
  dice: 'нарезать кубиками',
  mince: 'мелко нарезать',
  marinate: 'замариновать',
  soak: 'замочить',
  other: 'подготовить',
};

const INGREDIENT_GROUPS: Record<string, PrepTask['group']> = {
  овощи: 'vegetables',
  овощ: 'vegetables',
  лук: 'vegetables',
  морковь: 'vegetables',
  перец: 'vegetables',
  кабачок: 'vegetables',
  картофель: 'vegetables',
  помидор: 'vegetables',
  огурец: 'vegetables',
  мясо: 'meat',
  курица: 'meat',
  говядина: 'meat',
  свинина: 'meat',
  рыба: 'meat',
  фарш: 'meat',
  молоко: 'dairy',
  сыр: 'dairy',
  творог: 'dairy',
  сметана: 'dairy',
  йогурт: 'dairy',
  рис: 'grains',
  гречка: 'grains',
  овсянка: 'grains',
  макароны: 'grains',
  крупа: 'grains',
};

function categorizeIngredient(name: string): PrepTask['group'] {
  const lower = name.toLowerCase();
  for (const [key, group] of Object.entries(INGREDIENT_GROUPS)) {
    if (lower.includes(key)) return group;
  }
  return 'other';
}

function extractPrepAction(text: string): PrepTask['action'] {
  const lower = text.toLowerCase();
  if (lower.includes('кубиками') || lower.includes('кубик')) return 'dice';
  if (lower.includes('ломтиками') || lower.includes('ломтик')) return 'slice';
  if (lower.includes('мелко')) return 'mince';
  if (lower.includes('мариновать') || lower.includes('маринад')) return 'marinate';
  if (lower.includes('замочить') || lower.includes('замачивать')) return 'soak';
  if (lower.includes('нарезать')) return 'chop';
  return 'other';
}

function createPrepDescription(
  action: PrepTask['action'],
  ingredient: string,
  note?: string
): string {
  const actionText = PREP_ACTIONS[action];
  let description = `${actionText} ${ingredient}`;
  if (note) description += ` (${note})`;
  return description;
}

export function usePrepPlan() {
  const [currentPlan, setCurrentPlan] = useState<PrepPlan | null>(null);

  async function generatePrepPlan(recipes: Recipe[], date: string): Promise<PrepPlan> {
    const taskMap = new Map<string, PrepTask>();

    recipes.forEach((recipe) => {
      recipe.steps.forEach((step) => {
        if (!step.equipment || step.duration === undefined || step.duration < 5) {
          recipe.ingredients.forEach((ingredient) => {
            if (step.text.toLowerCase().includes(ingredient.name.toLowerCase())) {
              const group = categorizeIngredient(ingredient.name);
              const action = extractPrepAction(step.text);
              const key = `${ingredient.name}_${action}_${group}`;

              if (taskMap.has(key)) {
                const existing = taskMap.get(key)!;
                existing.amount += ingredient.amount;
                if (!existing.recipes.includes(recipe.id)) existing.recipes.push(recipe.id);
              } else {
                const task: PrepTask = {
                  id: nanoid(),
                  ingredient: ingredient.name,
                  action,
                  description: createPrepDescription(action, ingredient.name, ingredient.note),
                  amount: ingredient.amount,
                  unit: ingredient.unit,
                  recipes: [recipe.id],
                  order: 0,
                  group,
                  canPrepareAhead: group === 'vegetables' || group === 'grains',
                  storageTime: group === 'vegetables' ? 24 : group === 'meat' ? 12 : undefined,
                };
                taskMap.set(key, task);
              }
            }
          });
        }
      });
    });

    const groupedTasks = Array.from(taskMap.values());
    groupedTasks.sort((a, b) => {
      if (a.canPrepareAhead !== b.canPrepareAhead) return a.canPrepareAhead ? -1 : 1;
      const groupOrder: Record<PrepTask['group'], number> = {
        vegetables: 1,
        grains: 2,
        dairy: 3,
        meat: 4,
        other: 5,
      };
      return groupOrder[a.group] - groupOrder[b.group];
    });

    groupedTasks.forEach((task, index) => {
      task.order = index + 1;
    });

    const estimatedTime = groupedTasks.length * 5;
    const plan: PrepPlan = {
      id: nanoid(),
      date,
      tasks: groupedTasks,
      estimatedTime,
      completedTasks: [],
    };

    setCurrentPlan(plan);
    return plan;
  }

  async function savePrepPlan(plan: PrepPlan) {
    const existing = await dataService.prepPlans.getByDate(plan.date).catch(() => null);
    if (existing) {
      await dataService.prepPlans.update(plan.id, plan);
    } else {
      await dataService.prepPlans.create(plan);
    }
    setCurrentPlan(plan);
  }

  async function loadPrepPlan(date: string): Promise<PrepPlan | null> {
    try {
      const plan = await dataService.prepPlans.getByDate(date);
      if (plan) setCurrentPlan(plan);
      return plan ?? null;
    } catch {
      return null;
    }
  }

  async function completeTask(planId: string, taskId: string) {
    const plan = await dataService.prepPlans.get(planId).catch(() => null);
    if (plan && !plan.completedTasks.includes(taskId)) {
      const updated = {
        ...plan,
        completedTasks: [...plan.completedTasks, taskId],
      };
      await dataService.prepPlans.update(planId, updated);
      setCurrentPlan(updated);
    }
  }

  async function uncompleteTask(planId: string, taskId: string) {
    const plan = await dataService.prepPlans.get(planId).catch(() => null);
    if (plan) {
      const updated = {
        ...plan,
        completedTasks: plan.completedTasks.filter((id) => id !== taskId),
      };
      await dataService.prepPlans.update(planId, updated);
      setCurrentPlan(updated);
    }
  }

  return {
    currentPlan,
    generatePrepPlan,
    savePrepPlan,
    loadPrepPlan,
    completeTask,
    uncompleteTask,
  };
}

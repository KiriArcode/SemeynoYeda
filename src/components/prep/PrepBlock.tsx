import { useEffect, useState } from 'react';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import type { Recipe, PrepTask } from '../../data/schema';
import { usePrepPlan } from '../../hooks/usePrepPlan';
import { PrepTaskCard } from './PrepTaskCard';
import { Clock } from 'lucide-react';

interface PrepBlockProps {
  recipes: Recipe[];
  date: string;
}

const GROUP_LABELS: Record<PrepTask['group'], string> = {
  vegetables: 'Овощи',
  meat: 'Мясо',
  dairy: 'Молочные продукты',
  grains: 'Крупы',
  other: 'Другое',
};

export function PrepBlock({ recipes, date }: PrepBlockProps) {
  const { currentPlan, generatePrepPlan, savePrepPlan, completeTask, uncompleteTask } = usePrepPlan();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePlan();
  }, [recipes, date]);

  async function initializePlan() {
    try {
      let plan = await dataService.prepPlans.getByDate(date).catch(() => null);
      
      if (!plan && recipes.length > 0) {
        plan = await generatePrepPlan(recipes, date);
        await savePrepPlan(plan);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Failed to initialize prep plan:', error);
      setLoading(false);
    }
  }

  function handleToggleTask(taskId: string) {
    if (!currentPlan) return;

    if (currentPlan.completedTasks.includes(taskId)) {
      uncompleteTask(currentPlan.id, taskId);
    } else {
      completeTask(currentPlan.id, taskId);
    }
  }

  function getGroupedTasks() {
    if (!currentPlan) return new Map();

    const grouped = new Map<PrepTask['group'], typeof currentPlan.tasks>();
    currentPlan.tasks.forEach((task) => {
      if (!grouped.has(task.group)) {
        grouped.set(task.group, []);
      }
      grouped.get(task.group)!.push(task);
    });

    return grouped;
  }

  function getProgress() {
    if (!currentPlan || currentPlan.tasks.length === 0) return 0;
    return Math.round((currentPlan.completedTasks.length / currentPlan.tasks.length) * 100);
  }

  if (loading) {
    return (
      <div className="bg-dimension border border-nebula rounded-card p-4">
        <div className="text-text-mid font-body">Загрузка плана подготовки...</div>
      </div>
    );
  }

  if (!currentPlan || currentPlan.tasks.length === 0) {
    return (
      <div className="bg-dimension border border-nebula rounded-card p-5">
        <h3 className="font-heading text-xl font-bold text-portal mb-2">
          Подготовка к готовке
        </h3>
        <p className="text-text-mid font-body">
          Нет задач подготовки для выбранных рецептов
        </p>
      </div>
    );
  }

  const groupedTasks = getGroupedTasks();
  const progress = getProgress();

  return (
    <div className="bg-dimension border border-nebula rounded-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="font-heading text-xl font-bold text-portal mb-2">
          Подготовка к готовке
        </h3>
        <div className="flex items-center gap-4 text-sm font-mono text-text-dim">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {currentPlan.estimatedTime} мин
          </span>
          <span>{currentPlan.tasks.length} задач</span>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading font-semibold text-text-light">
            Прогресс
          </span>
          <span className="text-sm font-mono text-portal">{progress}%</span>
        </div>
        <div className="h-2 bg-rift rounded-pill overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-portal to-portal-dim transition-all duration-300 shadow-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Группы задач */}
      <div className="space-y-4">
        {Array.from(groupedTasks.entries()).map(([group, tasks]) => (
          <div key={group}>
            <h4 className="font-heading font-semibold text-text-light mb-2 text-sm">
              {GROUP_LABELS[group as PrepTask['group']]}
            </h4>
            <div className="space-y-2">
              {tasks.map((task: PrepTask) => (
                <PrepTaskCard
                  key={task.id}
                  task={task}
                  completed={currentPlan.completedTasks.includes(task.id)}
                  onToggle={() => handleToggleTask(task.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

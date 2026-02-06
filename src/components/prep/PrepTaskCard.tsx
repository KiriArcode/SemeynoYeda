import type { PrepTask } from '../../data/schema';
import { Clock, CheckCircle2 } from 'lucide-react';

interface PrepTaskCardProps {
  task: PrepTask;
  completed: boolean;
  onToggle: () => void;
}

const GROUP_ICONS: Record<PrepTask['group'], string> = {
  vegetables: '🥕',
  meat: '🥩',
  dairy: '🥛',
  grains: '🌾',
  other: '📦',
};

export function PrepTaskCard({ task, completed, onToggle }: PrepTaskCardProps) {
  return (
    <div
      className={`bg-dimension border rounded-card p-3 transition-all ${
        completed
          ? 'border-nebula opacity-60'
          : 'border-nebula hover:border-portal/30 hover:shadow-glow'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-button border-2 flex items-center justify-center transition-colors ${
            completed
              ? 'bg-portal border-portal'
              : 'border-nebula hover:border-portal'
          }`}
        >
          {completed && <CheckCircle2 className="w-3 h-3 text-void" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{GROUP_ICONS[task.group]}</span>
            <h4 className={`font-heading font-semibold text-sm ${
              completed ? 'text-text-dim line-through' : 'text-text-light'
            }`}>
              {task.ingredient}
            </h4>
          </div>

          <p className="text-xs font-body text-text-mid mb-2">
            {task.description}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-text-dim">
            <span>
              {task.amount} {task.unit}
            </span>
            {task.canPrepareAhead && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.storageTime ? `Хранится ${task.storageTime}ч` : 'Можно заранее'}
              </span>
            )}
          </div>

          {task.recipes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-nebula">
              <p className="text-xs text-text-dim font-body">
                Используется в: {task.recipes.length} {task.recipes.length === 1 ? 'рецепте' : 'рецептах'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

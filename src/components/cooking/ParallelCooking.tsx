import { useEffect, useState } from 'react';
import { useCookingTimers } from '../../hooks/useCookingTimers';
import { dataService } from '../../lib/dataService';
import type { Recipe } from '../../data/schema';
import { Pause, Play, X, Clock } from 'lucide-react';

export function ParallelCooking() {
  const { timers, getActiveTimers, pauseTimer, resumeTimer, stopTimer, getRemainingTime } = useCookingTimers();
  const [recipes, setRecipes] = useState<Map<string, Recipe>>(new Map());
  const [, setTime] = useState(Date.now());

  useEffect(() => {
    loadRecipes();
  }, [timers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadRecipes() {
    const recipeIds = Array.from(new Set(timers.map((t) => t.recipeId)));
    const allRecipes = await dataService.recipes.list();
    const recipeMap = new Map<string, Recipe>();
    recipeIds.forEach((id) => {
      const recipe = allRecipes.find((r) => r.id === id);
      if (recipe) recipeMap.set(recipe.id, recipe);
    });
    setRecipes(recipeMap);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getProgress(timer: typeof timers[0]): number {
    const total = timer.duration;
    const remaining = getRemainingTime(timer);
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  }

  const activeTimers = getActiveTimers();

  if (activeTimers.length === 0) {
    return (
      <div className="bg-dimension border border-nebula rounded-card p-5">
        <h3 className="font-heading text-xl font-bold text-text-light mb-2">
          Параллельная готовка
        </h3>
        <p className="text-text-mid font-body">
          Нет активных таймеров. Таймер запущен в параллельной вселенной
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-xl font-bold text-portal">
        Активные таймеры
      </h3>

      <div className="space-y-3">
        {activeTimers.map((timer) => {
          const recipe = recipes.get(timer.recipeId);
          const remaining = getRemainingTime(timer);
          const progress = getProgress(timer);

          return (
            <div
              key={timer.id}
              className="bg-rift border border-portal/30 rounded-card p-4 shadow-glow animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-portal" />
                    <h4 className="font-heading font-semibold text-text-light">
                      {timer.label}
                    </h4>
                  </div>
                  {recipe && (
                    <p className="text-sm text-text-dim font-body">
                      {recipe.title}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (timer.isActive ? pauseTimer(timer.id) : resumeTimer(timer.id))}
                    className="p-2 bg-dimension border border-nebula rounded-button hover:border-portal transition-colors"
                  >
                    {timer.isActive ? (
                      <Pause className="w-4 h-4 text-portal" />
                    ) : (
                      <Play className="w-4 h-4 text-portal" />
                    )}
                  </button>
                  <button
                    onClick={() => stopTimer(timer.id)}
                    className="p-2 bg-dimension border border-nebula rounded-button hover:border-ramen transition-colors"
                  >
                    <X className="w-4 h-4 text-text-mid" />
                  </button>
                </div>
              </div>

              {/* Прогресс-бар */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono text-portal font-semibold">
                    {formatTime(remaining)}
                  </span>
                  <span className="text-xs text-text-dim font-body">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-rift rounded-pill overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-portal to-portal-dim transition-all duration-1000 shadow-glow"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

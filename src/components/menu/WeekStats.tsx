import { useState, useEffect } from 'react';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import type { WeekMenu, Recipe } from '../../data/schema';
import { BarChart3, AlertTriangle } from 'lucide-react';

interface WeekStatsProps {
  weekMenu: WeekMenu;
}

interface CategoryCount {
  category: string;
  label: string;
  count: number;
  color: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Основное',
  sauce: 'Соусы',
  side: 'Гарниры',
  breakfast: 'Завтраки',
  snack: 'Полдник',
  soup: 'Супы',
  dessert: 'Десерты',
};

const CATEGORY_COLORS: Record<string, string> = {
  main: 'bg-portal',
  sauce: 'bg-ramen',
  side: 'bg-matcha',
  breakfast: 'bg-miso',
  snack: 'bg-plasma',
  soup: 'bg-frost',
  dessert: 'bg-portal-dim',
};

export function WeekStats({ weekMenu }: WeekStatsProps) {
  const [stats, setStats] = useState<CategoryCount[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    computeStats();
  }, [weekMenu]);

  async function computeStats() {
    try {
      const allRecipeIds = new Set<string>();
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            allRecipeIds.add(entry.recipeId);
          }
        }
      }

      const allRecipes = await dataService.recipes.list();
      const recipes = allRecipes.filter((r) => allRecipeIds.has(r.id));
      const recipeMap = new Map<string, Recipe>();
      for (const r of recipes) {
        if (r) recipeMap.set(r.id, r);
      }

      // Count categories across all meal slots
      const categoryCounts: Record<string, number> = {};
      const titleCounts: Record<string, number> = {};
      for (const day of weekMenu.days) {
        for (const meal of day.meals) {
          for (const entry of meal.recipes) {
            const recipe = recipeMap.get(entry.recipeId);
            if (recipe) {
              categoryCounts[recipe.category] = (categoryCounts[recipe.category] || 0) + 1;
              titleCounts[recipe.title] = (titleCounts[recipe.title] || 0) + 1;
            }
          }
        }
      }

      const result: CategoryCount[] = Object.entries(categoryCounts)
        .map(([cat, count]) => ({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          count,
          color: CATEGORY_COLORS[cat] || 'bg-nebula',
        }))
        .sort((a, b) => b.count - a.count);

      // Warnings for low diversity
      const newWarnings: string[] = [];
      for (const [title, count] of Object.entries(titleCounts)) {
        if (count >= 4) {
          newWarnings.push(`«${title}» — ${count} раз за неделю, попробуйте разнообразить`);
        }
      }

      setStats(result);
      setWarnings(newWarnings);
    } catch (error) {
      logger.error('[WeekStats] Error:', error);
    }
  }

  if (stats.length === 0) return null;

  const maxCount = Math.max(...stats.map(s => s.count));

  return (
    <div className="bg-dimension border border-nebula rounded-card p-4 mb-4 shadow-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left bg-card rounded-md py-2.5 px-3 border border-nebula/60"
      >
        <div className="flex items-center" style={{ gap: '8px' }}>
          <BarChart3 className="w-4 h-4 text-portal" />
          <span className="text-sm font-heading font-semibold text-text-light">Разнообразие недели</span>
        </div>
        <span className="text-xs text-text-dim font-mono">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Category bar chart */}
          <div className="space-y-1.5">
            {stats.map(s => (
              <div key={s.category} className="flex items-center" style={{ gap: '8px' }}>
                <span className="text-xs font-body text-text-dim w-20 text-right">{s.label}</span>
                <div className="flex-1 h-4 bg-rift rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-sm transition-all`}
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-mid w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-nebula">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start text-xs text-ramen font-body" style={{ gap: '6px' }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

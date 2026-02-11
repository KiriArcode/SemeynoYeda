import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { Recipe, FamilyMember, WabbaRating, WabbaRatings } from '../data/schema';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export function useWabba(evaluator: FamilyMember | null) {
  const [cards, setCards] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCards = useCallback(async () => {
    if (!evaluator || evaluator === 'both') return;
    setLoading(true);
    try {
      const cutoff = new Date(Date.now() - TWO_WEEKS_MS).toISOString();
      const all = await dataService.recipes.list();
      const recent = all.filter((r) => r.createdAt >= cutoff);
      const unrated = recent.filter((r) => {
        const ratings = r.wabbaRatings;
        if (!ratings) return true;
        if (ratings[evaluator]) return false; // уже оценил этот участник
        if (ratings.kolya && ratings.kristina) return false; // оба оценили — не показываем
        return true;
      });
      setCards(unrated);
      logger.log(`[useWabba] Loaded ${unrated.length} cards for ${evaluator}`);
    } catch (error) {
      logger.error('[useWabba] Failed to load cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [evaluator]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  function computeFinalState(ratings: WabbaRatings): Partial<Recipe> | null {
    if (!ratings.kolya || !ratings.kristina) return null;
    const kolyaLike = ratings.kolya === 'like';
    const kristinaLike = ratings.kristina === 'like';
    if (!kolyaLike && !kristinaLike) {
      return { excludedFromMenu: true };
    }
    if (kolyaLike && kristinaLike) return { suitableFor: 'both' as const };
    if (kolyaLike && !kristinaLike) return { suitableFor: 'kolya' as const };
    if (!kolyaLike && kristinaLike) return { suitableFor: 'kristina' as const };
    return null;
  }

  const swipe = useCallback(
    async (recipe: Recipe, rating: WabbaRating) => {
      const ratings: WabbaRatings = { ...recipe.wabbaRatings, [evaluator!]: rating };
      const final = computeFinalState(ratings);
      const updated: Partial<Recipe> = {
        wabbaRatings: ratings,
        updatedAt: new Date().toISOString(),
        ...(final ?? {}),
      };
      await dataService.recipes.update(recipe.id, updated);
      setCards((prev) => prev.filter((r) => r.id !== recipe.id));
      logger.log(`[useWabba] Swiped ${recipe.title} ${rating} by ${evaluator}`);
    },
    [evaluator]
  );

  return { cards, loading, swipe, reload: loadCards };
}

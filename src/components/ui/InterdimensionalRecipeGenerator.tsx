import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { nanoid } from 'nanoid';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import { getRandomRickQuote } from '../../data/rickQuotes';
import type { Recipe } from '../../data/schema';
import { PortalButton } from './PortalButton';
import { PortalSpinner } from './PortalSpinner';
import { GlitchText } from './GlitchText';
import { Tag } from './Tag';

interface InterdimensionalRecipeGeneratorProps {
  onRecipeSelect?: (recipe: Recipe) => void;
}

const interdimensionalPrefixes = [
  'C-137',
  'Interdimensional',
  'Multiverse',
  'Portal',
  'Quantum',
  'Dimension X',
  'Parallel Universe',
  'Rick\'s',
  'Morty\'s',
  'Galactic',
];

const difficultyLabels = ['Легко', 'Средне', 'Сложно'];
const complexityEmojis = ['🟢', '🟡', '🔴'];

export function InterdimensionalRecipeGenerator({ onRecipeSelect }: InterdimensionalRecipeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [rickQuote, setRickQuote] = useState<string>('');
  const [existingRecipes, setExistingRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      const recipes = await dataService.recipes.list();
      setExistingRecipes(recipes);
    } catch (error) {
      logger.error('Failed to load recipes:', error);
    }
  }

  function generateInterdimensionalRecipe(): Recipe {
    if (existingRecipes.length === 0) {
      // Fallback если нет рецептов
      return createFallbackRecipe();
    }

    // Выбираем случайный рецепт из существующих
    const baseRecipe = existingRecipes[Math.floor(Math.random() * existingRecipes.length)];
    const prefix = interdimensionalPrefixes[Math.floor(Math.random() * interdimensionalPrefixes.length)];
    
    // Генерируем новое название
    const newTitle = `${prefix} ${baseRecipe.title}`;
    const newSlug = `${baseRecipe.slug}-${prefix.toLowerCase().replace(/\s+/g, '-')}`;

    // Создаём новый рецепт на основе существующего
    const newRecipe: Recipe = {
      ...baseRecipe,
      id: nanoid(),
      slug: newSlug,
      title: newTitle,
      subtitle: `Измерение ${prefix}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newRecipe;
  }

  function createFallbackRecipe(): Recipe {
    const prefix = interdimensionalPrefixes[Math.floor(Math.random() * interdimensionalPrefixes.length)];
    const now = new Date().toISOString();
    
    return {
      id: nanoid(),
      slug: `${prefix.toLowerCase()}-recipe`,
      title: `${prefix} Рецепт`,
      category: 'main',
      tags: ['quick'],
      suitableFor: 'both',
      prepTime: 10,
      cookTime: 15,
      totalTime: 25,
      servings: 4,
      ingredients: [
        { name: 'Ингредиент 1', amount: 200, unit: 'г' },
        { name: 'Ингредиент 2', amount: 1, unit: 'шт' },
      ],
      steps: [
        { order: 1, text: 'Подготовить ингредиенты', duration: 10 },
        { order: 2, text: 'Приготовить блюдо', duration: 15 },
      ],
      equipment: ['stove'],
      storage: { fridge: 3 },
      createdAt: now,
      updatedAt: now,
    };
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setRickQuote(getRandomRickQuote());

    // Анимация генерации
    await new Promise(resolve => setTimeout(resolve, 1500));

    const recipe = generateInterdimensionalRecipe();
    setGeneratedRecipe(recipe);
    setIsGenerating(false);
  }

  function handleSelect() {
    if (generatedRecipe && onRecipeSelect) {
      onRecipeSelect(generatedRecipe);
    }
  }

  const difficulty = generatedRecipe 
    ? (generatedRecipe.totalTime <= 30 ? 0 : generatedRecipe.totalTime <= 60 ? 1 : 2)
    : 0;

  return (
    <div className="bg-card border border-nebula rounded-card p-6">
      <div className="text-center mb-6">
        <GlitchText 
          text="Генератор межпространственных рецептов" 
          continuous 
          intensity="low"
          as="h2"
          className="text-2xl mb-2 text-portal"
        />
        <p className="text-sm text-text-secondary">
          Открой портал в другое измерение и получи случайный рецепт!
        </p>
      </div>

      {!generatedRecipe && !isGenerating && (
        <div className="flex justify-center">
          <PortalButton onClick={handleGenerate} size="lg">
            Открыть портал
          </PortalButton>
        </div>
      )}

      {isGenerating && (
        <motion.div
          className="flex flex-col items-center justify-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <PortalSpinner size="lg" />
          <motion.p
            className="mt-4 text-portal font-mono text-sm"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Открываем портал...
          </motion.p>
          {rickQuote && (
            <motion.p
              className="mt-2 text-xs text-text-secondary italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              "{rickQuote}"
            </motion.p>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {generatedRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <div className="bg-elevated border border-portal/20 rounded-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-heading font-bold text-text-primary mb-1">
                    {generatedRecipe.title}
                  </h3>
                  {generatedRecipe.subtitle && (
                    <p className="text-sm text-text-secondary">{generatedRecipe.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{complexityEmojis[difficulty]}</span>
                  <span className="text-xs text-text-muted">{difficultyLabels[difficulty]}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Tag variant="default">Время: {generatedRecipe.totalTime} мин</Tag>
                {generatedRecipe.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} variant={tag === 'quick' ? 'quick' : tag === 'prep-day' ? 'prep-day' : 'default'}>
                    {tag}
                  </Tag>
                ))}
              </div>

              {rickQuote && (
                <div className="mb-4 px-3 py-2 bg-portal/10 border border-portal/20 rounded-card">
                  <p className="text-xs font-mono text-portal italic">"{rickQuote}"</p>
                  <p className="text-xs text-text-muted mt-1">— Рик Санчез</p>
                </div>
              )}

              <div className="flex gap-2">
                <PortalButton onClick={handleSelect} size="md" className="flex-1">
                  Добавить рецепт
                </PortalButton>
                <PortalButton onClick={handleGenerate} variant="secondary" size="md">
                  Ещё раз
                </PortalButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

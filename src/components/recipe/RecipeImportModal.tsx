import { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import type { Recipe } from '../../data/schema';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

interface RecipeImportItem {
  recipe: Recipe;
  status: 'pending' | 'duplicate' | 'error' | 'success';
  error?: string;
  existingId?: string;
}

export function RecipeImportModal({ isOpen, onClose, onImportComplete }: RecipeImportModalProps) {
  const [recipes, setRecipes] = useState<RecipeImportItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; duplicates: number } | null>(null);

  const validateRecipe = (data: unknown): Recipe | null => {
    if (!data || typeof data !== 'object') return null;
    const r = data as Record<string, unknown>;
    
    // Check required fields
    if (
      typeof r.id !== 'string' ||
      typeof r.slug !== 'string' ||
      typeof r.title !== 'string' ||
      typeof r.category !== 'string' ||
      !Array.isArray(r.tags) ||
      typeof r.suitableFor !== 'string' ||
      typeof r.prepTime !== 'number' ||
      typeof r.cookTime !== 'number' ||
      typeof r.totalTime !== 'number' ||
      typeof r.servings !== 'number' ||
      !Array.isArray(r.ingredients) ||
      !Array.isArray(r.steps) ||
      !Array.isArray(r.equipment) ||
      !r.storage || typeof r.storage !== 'object'
    ) {
      return null;
    }

    // Generate createdAt/updatedAt if missing
    const now = new Date().toISOString();
    
    return {
      id: r.id as string,
      slug: r.slug as string,
      title: r.title as string,
      subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
      category: r.category as Recipe['category'],
      tags: r.tags as Recipe['tags'],
      suitableFor: r.suitableFor as Recipe['suitableFor'],
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      totalTime: r.totalTime,
      servings: r.servings,
      ingredients: r.ingredients as Recipe['ingredients'],
      steps: r.steps as Recipe['steps'],
      equipment: r.equipment as Recipe['equipment'],
      notes: typeof r.notes === 'string' ? r.notes : undefined,
      storage: r.storage as Recipe['storage'],
      reheating: Array.isArray(r.reheating) ? r.reheating as Recipe['reheating'] : undefined,
      version: typeof r.version === 'number' ? r.version : undefined,
      source: typeof r.source === 'string' ? r.source : undefined,
      imageUrl: typeof r.imageUrl === 'string' ? r.imageUrl : undefined,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
    };
  };

  const checkDuplicates = async (recipe: Recipe): Promise<{ isDuplicate: boolean; existingId?: string }> => {
    try {
      const allRecipes = await dataService.recipes.list();
      const existingByTitle = allRecipes.find(r => r.title === recipe.title);
      const existingBySlug = allRecipes.find(r => r.slug === recipe.slug);
      
      if (existingByTitle) {
        return { isDuplicate: true, existingId: existingByTitle.id };
      }
      if (existingBySlug) {
        return { isDuplicate: true, existingId: existingBySlug.id };
      }
      return { isDuplicate: false };
    } catch (error) {
      logger.error('[RecipeImportModal] Error checking duplicates:', error);
      return { isDuplicate: false };
    }
  };

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle both single recipe and array of recipes
      const recipeArray = Array.isArray(data) ? data : [data];
      
      const validatedRecipes: RecipeImportItem[] = [];
      
      for (const item of recipeArray) {
        const recipe = validateRecipe(item);
        if (!recipe) {
          validatedRecipes.push({
            recipe: {} as Recipe,
            status: 'error',
            error: 'Неверная структура данных',
          });
          continue;
        }

        const duplicateCheck = await checkDuplicates(recipe);
        if (duplicateCheck.isDuplicate) {
          validatedRecipes.push({
            recipe,
            status: 'duplicate',
            existingId: duplicateCheck.existingId,
          });
        } else {
          validatedRecipes.push({
            recipe,
            status: 'pending',
          });
        }
      }
      
      setRecipes(validatedRecipes);
      setImportResults(null);
    } catch (error) {
      logger.error('[RecipeImportModal] Error parsing file:', error);
      setRecipes([{
        recipe: {} as Recipe,
        status: 'error',
        error: error instanceof Error ? error.message : 'Ошибка парсинга JSON',
      }]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFile(file);
    } else {
      logger.error('[RecipeImportModal] Invalid file type');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const toggleRecipeSelection = useCallback((index: number) => {
    setRecipes(prev => prev.map((item, i) => 
      i === index && item.status === 'duplicate'
        ? { ...item, status: 'pending' }
        : i === index && item.status === 'pending'
        ? { ...item, status: 'duplicate' }
        : item
    ));
  }, []);

  const handleImport = useCallback(async () => {
    const recipesToImport = recipes.filter(r => r.status === 'pending');
    if (recipesToImport.length === 0) {
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;
    const duplicatesCount = recipes.filter(r => r.status === 'duplicate').length;

    const updatedRecipes = [...recipes];

    for (let i = 0; i < recipesToImport.length; i++) {
      const item = recipesToImport[i];
      try {
        await dataService.recipes.create(item.recipe);
        const index = recipes.findIndex(r => r.recipe.id === item.recipe.id);
        if (index !== -1) {
          updatedRecipes[index] = { ...item, status: 'success' };
        }
        successCount++;
      } catch (error) {
        logger.error('[RecipeImportModal] Error importing recipe:', error);
        const index = recipes.findIndex(r => r.recipe.id === item.recipe.id);
        if (index !== -1) {
          updatedRecipes[index] = {
            ...item,
            status: 'error',
            error: error instanceof Error ? error.message : 'Ошибка импорта',
          };
        }
        failedCount++;
      }
    }

    setRecipes(updatedRecipes);
    setImportResults({ success: successCount, failed: failedCount, duplicates: duplicatesCount });
    setIsImporting(false);

    if (onImportComplete && successCount > 0) {
      onImportComplete(successCount);
    }
  }, [recipes, onImportComplete]);

  const handleClose = useCallback(() => {
    setRecipes([]);
    setImportResults(null);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  const hasPendingRecipes = recipes.some(r => r.status === 'pending');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Импорт рецептов"
      footer={
        <>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors"
          >
            Закрыть
          </button>
          {hasPendingRecipes && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-4 py-2 bg-portal text-void font-heading font-semibold text-sm rounded-button hover:bg-portal-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Импорт...
                </>
              ) : (
                `Импортировать (${recipes.filter(r => r.status === 'pending').length})`
              )}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* File upload area */}
        {recipes.length === 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-card p-8 text-center transition-colors ${
              isDragging
                ? 'border-portal bg-portal-soft'
                : 'border-nebula hover:border-portal/50'
            }`}
          >
            <Upload className="w-12 h-12 text-portal mx-auto mb-4" />
            <p className="text-text-primary font-heading font-semibold mb-2">
              Перетащите JSON файл сюда
            </p>
            <p className="text-text-muted text-sm mb-4">или</p>
            <label className="inline-block px-4 py-2 bg-portal text-void font-heading font-semibold rounded-button cursor-pointer hover:bg-portal-dim transition-colors">
              Выбрать файл
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-text-dim text-xs mt-4">
              Поддерживается один рецепт или массив рецептов в формате JSON
            </p>
          </div>
        )}

        {/* Recipe list */}
        {recipes.length > 0 && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {recipes.map((item, index) => {
              if (item.status === 'error' && !item.recipe.title) {
                return (
                  <div
                    key={index}
                    className="bg-rift border border-ramen/30 rounded-card p-3 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-ramen flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-text-primary font-heading font-semibold text-sm">
                        Ошибка валидации
                      </p>
                      <p className="text-text-muted text-xs mt-1">{item.error}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.recipe.id || index}
                  className={`border rounded-card p-3 flex items-start gap-3 ${
                    item.status === 'duplicate'
                      ? 'bg-rift border-nebula opacity-75'
                      : item.status === 'error'
                      ? 'bg-rift border-ramen/30'
                      : item.status === 'success'
                      ? 'bg-portal-soft border-portal/30'
                      : 'bg-card border-nebula'
                  }`}
                >
                  {item.status === 'duplicate' && (
                    <button
                      onClick={() => toggleRecipeSelection(index)}
                      className="mt-0.5 w-5 h-5 rounded-button border-2 border-nebula hover:border-portal flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3 text-text-dim" />
                    </button>
                  )}
                  {item.status === 'pending' && (
                    <button
                      onClick={() => toggleRecipeSelection(index)}
                      className="mt-0.5 w-5 h-5 rounded-button border-2 border-portal hover:border-portal-dim flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3 h-3 text-portal" />
                    </button>
                  )}
                  {item.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-portal flex-shrink-0 mt-0.5" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-ramen flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-text-primary font-heading font-semibold text-sm">
                        {item.recipe.title || 'Неизвестный рецепт'}
                      </p>
                      {item.status === 'duplicate' && (
                        <span className="text-xs px-2 py-0.5 bg-nebula text-text-dim rounded-full">
                          Дубликат
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-xs px-2 py-0.5 bg-portal/20 text-portal rounded-full">
                          Импортирован
                        </span>
                      )}
                    </div>
                    {item.recipe.subtitle && (
                      <p className="text-text-muted text-xs mb-1">{item.recipe.subtitle}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      <span>{item.recipe.category}</span>
                      <span>·</span>
                      <span>{item.recipe.totalTime} мин</span>
                      <span>·</span>
                      <span>{item.recipe.servings} порций</span>
                    </div>
                    {item.error && (
                      <p className="text-ramen text-xs mt-1">{item.error}</p>
                    )}
                    {item.existingId && (
                      <p className="text-text-muted text-xs mt-1">
                        Существующий ID: {item.existingId}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Import results */}
        {importResults && (
          <div className="bg-card border border-elevated rounded-card p-4">
            <p className="text-text-primary font-heading font-semibold mb-2">Результаты импорта:</p>
            <div className="space-y-1 text-sm">
              <p className="text-portal">
                ✓ Успешно импортировано: {importResults.success}
              </p>
              {importResults.duplicates > 0 && (
                <p className="text-text-muted">
                  ⊘ Пропущено дубликатов: {importResults.duplicates}
                </p>
              )}
              {importResults.failed > 0 && (
                <p className="text-ramen">
                  ✗ Ошибок: {importResults.failed}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

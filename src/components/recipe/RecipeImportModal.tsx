import { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { dataService } from '../../lib/dataService';
import { logger } from '../../lib/logger';
import type { Recipe } from '../../data/schema';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Download, Sparkles } from 'lucide-react';
import { downloadJsonFile } from '../../lib/fileDownload';
import { DuplicateResolutionDialog } from './DuplicateResolutionDialog';
import { AIPromptGenerator } from './AIPromptGenerator';

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (importedCount: number) => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  recipe: Recipe | null;
  errors: ValidationError[];
  isIncomplete: boolean;
  missingCriticalFields: string[];
}

interface RecipeImportItem {
  recipe: Recipe | null;
  status: 'pending' | 'duplicate' | 'error' | 'success' | 'incomplete';
  error?: string;
  errors?: ValidationError[];
  existingId?: string;
  duplicateAction?: 'update' | 'skip';
}

export function RecipeImportModal({ isOpen, onClose, onImportComplete }: RecipeImportModalProps) {
  const [recipes, setRecipes] = useState<RecipeImportItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ 
    success: number; 
    failed: number; 
    duplicates: number;
    incomplete: number;
    errors: number;
  } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorRecipes, setErrorRecipes] = useState<unknown[]>([]);
  const [incompleteRecipes, setIncompleteRecipes] = useState<unknown[]>([]);
  const [duplicateDialog, setDuplicateDialog] = useState<{
    index: number;
    recipe: Recipe;
    existingId: string;
  } | null>(null);
  const [showAIPromptGenerator, setShowAIPromptGenerator] = useState(false);

  // Критичные поля (обязательные)
  const CRITICAL_FIELDS: string[] = [
    'id', 'slug', 'title', 'category', 'tags', 'suitableFor',
    'prepTime', 'cookTime', 'totalTime', 'servings',
    'ingredients', 'steps', 'equipment', 'storage'
  ];

  const validateRecipe = (data: unknown): ValidationResult => {
    const errors: ValidationError[] = [];
    const missingCriticalFields: string[] = [];

    if (!data || typeof data !== 'object') {
      return {
        recipe: null,
        errors: [{ field: 'root', message: 'Данные не являются объектом' }],
        isIncomplete: false,
        missingCriticalFields: CRITICAL_FIELDS,
      };
    }

    const r = data as Record<string, unknown>;
    const now = new Date().toISOString();

    // Проверка критичных полей
    if (typeof r.id !== 'string') {
      errors.push({ field: 'id', message: 'Отсутствует или неверный тип (должна быть строка)' });
      missingCriticalFields.push('id');
    }
    if (typeof r.slug !== 'string') {
      errors.push({ field: 'slug', message: 'Отсутствует или неверный тип (должна быть строка)' });
      missingCriticalFields.push('slug');
    }
    if (typeof r.title !== 'string') {
      errors.push({ field: 'title', message: 'Отсутствует или неверный тип (должна быть строка)' });
      missingCriticalFields.push('title');
    }
    if (typeof r.category !== 'string') {
      errors.push({ field: 'category', message: 'Отсутствует или неверный тип (должна быть строка)' });
      missingCriticalFields.push('category');
    } else {
      const validCategories = ['main', 'sauce', 'side', 'breakfast', 'snack', 'soup', 'dessert'];
      if (!validCategories.includes(r.category)) {
        errors.push({ field: 'category', message: `Неверное значение. Допустимые: ${validCategories.join(', ')}` });
      }
    }
    if (!Array.isArray(r.tags)) {
      errors.push({ field: 'tags', message: 'Отсутствует или неверный тип (должен быть массив)' });
      missingCriticalFields.push('tags');
    }
    if (typeof r.suitableFor !== 'string') {
      errors.push({ field: 'suitableFor', message: 'Отсутствует или неверный тип (должна быть строка)' });
      missingCriticalFields.push('suitableFor');
    } else {
      const validSuitableFor = ['kolya', 'kristina', 'both'];
      if (!validSuitableFor.includes(r.suitableFor)) {
        errors.push({ field: 'suitableFor', message: `Неверное значение. Допустимые: ${validSuitableFor.join(', ')}` });
      }
    }
    if (typeof r.prepTime !== 'number') {
      errors.push({ field: 'prepTime', message: 'Отсутствует или неверный тип (должно быть число)' });
      missingCriticalFields.push('prepTime');
    }
    if (typeof r.cookTime !== 'number') {
      errors.push({ field: 'cookTime', message: 'Отсутствует или неверный тип (должно быть число)' });
      missingCriticalFields.push('cookTime');
    }
    if (typeof r.totalTime !== 'number') {
      errors.push({ field: 'totalTime', message: 'Отсутствует или неверный тип (должно быть число)' });
      missingCriticalFields.push('totalTime');
    }
    if (typeof r.servings !== 'number') {
      errors.push({ field: 'servings', message: 'Отсутствует или неверный тип (должно быть число)' });
      missingCriticalFields.push('servings');
    }
    if (!Array.isArray(r.ingredients)) {
      errors.push({ field: 'ingredients', message: 'Отсутствует или неверный тип (должен быть массив)' });
      missingCriticalFields.push('ingredients');
    }
    if (!Array.isArray(r.steps)) {
      errors.push({ field: 'steps', message: 'Отсутствует или неверный тип (должен быть массив)' });
      missingCriticalFields.push('steps');
    }
    if (!Array.isArray(r.equipment)) {
      errors.push({ field: 'equipment', message: 'Отсутствует или неверный тип (должен быть массив)' });
      missingCriticalFields.push('equipment');
    }
    if (!r.storage || typeof r.storage !== 'object') {
      errors.push({ field: 'storage', message: 'Отсутствует или неверный тип (должен быть объект)' });
      missingCriticalFields.push('storage');
    }

    // Если есть критичные ошибки, возвращаем null
    if (missingCriticalFields.length > 0) {
      return {
        recipe: null,
        errors,
        isIncomplete: true,
        missingCriticalFields,
      };
    }

    // Если есть некритичные ошибки, но критичные поля есть - создаем рецепт с дефолтами
    try {
      const recipe: Recipe = {
        id: r.id as string,
        slug: r.slug as string,
        title: r.title as string,
        subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
        category: r.category as Recipe['category'],
        tags: (r.tags as Recipe['tags']) || [],
        suitableFor: r.suitableFor as Recipe['suitableFor'],
        prepTime: r.prepTime as number,
        cookTime: r.cookTime as number,
        totalTime: r.totalTime as number,
        servings: r.servings as number,
        ingredients: (r.ingredients as Recipe['ingredients']) || [],
        steps: (r.steps as Recipe['steps']) || [],
        equipment: (r.equipment as Recipe['equipment']) || [],
        notes: typeof r.notes === 'string' ? r.notes : undefined,
        storage: (r.storage as Recipe['storage']) || {},
        reheating: Array.isArray(r.reheating) ? r.reheating as Recipe['reheating'] : undefined,
        version: typeof r.version === 'number' ? r.version : undefined,
        source: typeof r.source === 'string' ? r.source : undefined,
        imageUrl: typeof r.imageUrl === 'string' ? r.imageUrl : undefined,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
      };

      return {
        recipe,
        errors: errors.length > 0 ? errors : [],
        isIncomplete: errors.length > 0,
        missingCriticalFields: [],
      };
    } catch (error) {
      errors.push({ field: 'root', message: `Ошибка создания рецепта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` });
      return {
        recipe: null,
        errors,
        isIncomplete: true,
        missingCriticalFields: CRITICAL_FIELDS,
      };
    }
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
      const errorItems: unknown[] = [];
      const incompleteItems: unknown[] = [];
      
      for (const item of recipeArray) {
        const validation = validateRecipe(item);
        
        // Если есть критичные ошибки - сохраняем в список ошибок
        if (!validation.recipe && validation.missingCriticalFields.length > 0) {
          errorItems.push(item);
          validatedRecipes.push({
            recipe: null,
            status: 'error',
            error: `Отсутствуют критичные поля: ${validation.missingCriticalFields.join(', ')}`,
            errors: validation.errors,
          });
          continue;
        }

        // Если рецепт валиден, но есть некритичные ошибки - помечаем как incomplete
        if (validation.recipe && validation.isIncomplete && validation.errors.length > 0) {
          incompleteItems.push(item);
          const duplicateCheck = await checkDuplicates(validation.recipe);
          if (duplicateCheck.isDuplicate) {
            validatedRecipes.push({
              recipe: validation.recipe,
              status: 'duplicate',
              existingId: duplicateCheck.existingId,
              errors: validation.errors,
            });
          } else {
            validatedRecipes.push({
              recipe: validation.recipe,
              status: 'incomplete',
              errors: validation.errors,
            });
          }
          continue;
        }

        // Если рецепт полностью валиден
        if (validation.recipe) {
          const duplicateCheck = await checkDuplicates(validation.recipe);
          if (duplicateCheck.isDuplicate) {
            validatedRecipes.push({
              recipe: validation.recipe,
              status: 'duplicate',
              existingId: duplicateCheck.existingId,
            });
          } else {
            validatedRecipes.push({
              recipe: validation.recipe,
              status: 'pending',
            });
          }
        }
      }
      
      setErrorRecipes(errorItems);
      setIncompleteRecipes(incompleteItems);
      setRecipes(validatedRecipes);
      setImportResults(null);
    } catch (error) {
      logger.error('[RecipeImportModal] Error parsing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка парсинга JSON';
      setRecipes([{
        recipe: null,
        status: 'error',
        error: errorMessage,
      }]);
      setErrorRecipes([{ parseError: errorMessage }]);
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

  const handleDuplicateResolution = useCallback((index: number, action: 'update' | 'skip') => {
    setRecipes(prev => prev.map((item, i) => 
      i === index && item.status === 'duplicate'
        ? { ...item, duplicateAction: action, status: action === 'update' ? 'pending' : 'duplicate' }
        : item
    ));
  }, []);

  const openDuplicateDialog = useCallback((index: number) => {
    const item = recipes[index];
    if (item && item.recipe && item.status === 'duplicate' && item.existingId) {
      setDuplicateDialog({
        index,
        recipe: item.recipe,
        existingId: item.existingId,
      });
    }
  }, [recipes]);

  const handleImport = useCallback(async () => {
    const recipesToImport = recipes.filter(r => 
      r.status === 'pending' || 
      (r.status === 'duplicate' && r.duplicateAction === 'update') ||
      (r.status === 'incomplete')
    );
    if (recipesToImport.length === 0) {
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: recipesToImport.length });
    let successCount = 0;
    let failedCount = 0;
    const duplicatesCount = recipes.filter(r => r.status === 'duplicate' && r.duplicateAction !== 'update').length;
    const incompleteCount = recipes.filter(r => r.status === 'incomplete').length;
    const errorsCount = recipes.filter(r => r.status === 'error').length;

    const updatedRecipes = [...recipes];

    for (let i = 0; i < recipesToImport.length; i++) {
      const item = recipesToImport[i];
      if (!item.recipe) continue;

      setImportProgress({ current: i + 1, total: recipesToImport.length });

      try {
        // Если это дубликат с действием "обновить"
        if (item.status === 'duplicate' && item.duplicateAction === 'update' && item.existingId) {
          await dataService.recipes.update(item.existingId, item.recipe);
        } else {
          await dataService.recipes.create(item.recipe);
        }
        
        const index = recipes.findIndex(r => r.recipe?.id === item.recipe?.id);
        if (index !== -1) {
          updatedRecipes[index] = { ...item, status: 'success' };
        }
        successCount++;
      } catch (error) {
        logger.error('[RecipeImportModal] Error importing recipe:', error);
        const index = recipes.findIndex(r => r.recipe?.id === item.recipe?.id);
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
    setImportResults({ 
      success: successCount, 
      failed: failedCount, 
      duplicates: duplicatesCount,
      incomplete: incompleteCount,
      errors: errorsCount,
    });
    setImportProgress(null);
    setIsImporting(false);

    if (onImportComplete && successCount > 0) {
      onImportComplete(successCount);
    }
  }, [recipes, onImportComplete]);

  const handleClose = useCallback(() => {
    setRecipes([]);
    setImportResults(null);
    setIsDragging(false);
    setErrorRecipes([]);
    setIncompleteRecipes([]);
    setImportProgress(null);
    onClose();
  }, [onClose]);

  const handleDownloadErrors = useCallback(() => {
    if (errorRecipes.length > 0) {
      downloadJsonFile(errorRecipes, 'recipes_errors.json');
    }
  }, [errorRecipes]);

  const handleDownloadIncomplete = useCallback(() => {
    if (incompleteRecipes.length > 0) {
      downloadJsonFile(incompleteRecipes, 'recipes_incomplete.json');
    }
  }, [incompleteRecipes]);

  const hasPendingRecipes = recipes.some(r => 
    r.status === 'pending' || 
    (r.status === 'duplicate' && r.duplicateAction === 'update') ||
    r.status === 'incomplete'
  );

  const pendingCount = recipes.filter(r => 
    r.status === 'pending' || 
    (r.status === 'duplicate' && r.duplicateAction === 'update') ||
    r.status === 'incomplete'
  ).length;

  return (
    <>
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
                `Импортировать (${pendingCount})`
              )}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* File upload area */}
        {recipes.length === 0 && (
          <div className="space-y-4">
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
            <div className="border-t border-nebula pt-4">
              <button
                onClick={() => setShowAIPromptGenerator(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-heading font-semibold text-portal border border-portal/50 rounded-button hover:bg-portal/10 transition-colors w-full justify-center"
              >
                <Sparkles className="w-4 h-4" />
                Сгенерировать промпт для AI
              </button>
              <p className="text-text-dim text-xs mt-2 text-center">
                Создайте промпт для Gemini или Claude для генерации рецептов
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isImporting && importProgress && (
          <div className="bg-card border border-nebula rounded-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-primary font-heading font-semibold text-sm">
                Импорт рецептов...
              </p>
              <p className="text-text-muted text-xs">
                {importProgress.current} / {importProgress.total}
              </p>
            </div>
            <div className="w-full bg-rift rounded-full h-2 overflow-hidden">
              <div
                className="bg-portal h-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Recipe list */}
        {recipes.length > 0 && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {recipes.map((item, index) => {
              if (item.status === 'error' && !item.recipe) {
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
                      {item.errors && item.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.errors.map((err, errIdx) => (
                            <p key={errIdx} className="text-text-muted text-xs">
                              <strong>{err.field}:</strong> {err.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (!item.recipe) return null;

              const statusColors = {
                duplicate: 'bg-rift border-nebula opacity-75',
                error: 'bg-rift border-ramen/30',
                success: 'bg-portal-soft border-portal/30',
                incomplete: 'bg-rift border-accent-orange/30',
                pending: 'bg-card border-nebula',
              };

              return (
                <div
                  key={item.recipe.id || index}
                  className={`border rounded-card p-3 flex items-start gap-3 ${statusColors[item.status] || statusColors.pending}`}
                >
                  {item.status === 'duplicate' && (
                    <button
                      onClick={() => openDuplicateDialog(index)}
                      className="mt-0.5 w-5 h-5 rounded-button border-2 border-nebula hover:border-portal flex items-center justify-center transition-colors flex-shrink-0"
                      title="Выбрать действие для дубликата"
                    >
                      <X className="w-3 h-3 text-text-dim" />
                    </button>
                  )}
                  {(item.status === 'pending' || item.status === 'incomplete') && (
                    <div className="mt-0.5 w-5 h-5 rounded-button border-2 border-portal flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-portal" />
                    </div>
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
                      {item.status === 'incomplete' && (
                        <span className="text-xs px-2 py-0.5 bg-accent-orange/20 text-accent-orange rounded-full">
                          Неполные данные
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
                    {item.errors && item.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.errors.map((err, errIdx) => (
                          <p key={errIdx} className="text-text-muted text-xs">
                            <strong>{err.field}:</strong> {err.message}
                          </p>
                        ))}
                      </div>
                    )}
                    {item.existingId && (
                      <p className="text-text-muted text-xs mt-1">
                        Существующий ID: {item.existingId}
                      </p>
                    )}
                    {item.status === 'duplicate' && item.duplicateAction && (
                      <p className="text-portal text-xs mt-1">
                        {item.duplicateAction === 'update' ? 'Будет обновлен' : 'Будет пропущен'}
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
          <div className="bg-card border border-elevated rounded-card p-4 space-y-3">
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
              {importResults.incomplete > 0 && (
                <p className="text-accent-orange">
                  ⚠ Импортировано с неполными данными: {importResults.incomplete}
                </p>
              )}
              {importResults.errors > 0 && (
                <p className="text-ramen">
                  ✗ Ошибок валидации: {importResults.errors}
                </p>
              )}
              {importResults.failed > 0 && (
                <p className="text-ramen">
                  ✗ Ошибок импорта: {importResults.failed}
                </p>
              )}
            </div>
            {(errorRecipes.length > 0 || incompleteRecipes.length > 0) && (
              <div className="pt-3 border-t border-nebula space-y-2">
                <p className="text-text-muted text-xs mb-2">
                  Скачать файлы с проблемными рецептами:
                </p>
                <div className="flex gap-2">
                  {errorRecipes.length > 0 && (
                    <button
                      onClick={handleDownloadErrors}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold text-ramen border border-ramen/30 rounded-button hover:bg-ramen/10 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Ошибки ({errorRecipes.length})
                    </button>
                  )}
                  {incompleteRecipes.length > 0 && (
                    <button
                      onClick={handleDownloadIncomplete}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-semibold text-accent-orange border border-accent-orange/30 rounded-button hover:bg-accent-orange/10 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Неполные ({incompleteRecipes.length})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
    {duplicateDialog && (
      <DuplicateResolutionDialog
        isOpen={!!duplicateDialog}
        onClose={() => setDuplicateDialog(null)}
        recipe={duplicateDialog.recipe}
        existingId={duplicateDialog.existingId}
        onResolve={(action) => {
          handleDuplicateResolution(duplicateDialog.index, action);
          setDuplicateDialog(null);
        }}
      />
    )}
    <AIPromptGenerator
      isOpen={showAIPromptGenerator}
      onClose={() => setShowAIPromptGenerator(false)}
    />
    </>
  );
}

import type { Recipe, Ingredient } from '../data/schema';

/**
 * Нормализует название для сравнения (lowercase, удаление лишних пробелов)
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Находит рецепт по названию ингредиента
 * Сравнивает нормализованные названия (без учета регистра и лишних пробелов)
 */
export function findRecipeByIngredientName(
  ingredientName: string,
  allRecipes: Recipe[]
): Recipe | null {
  const normalizedIngredient = normalizeName(ingredientName);
  
  return allRecipes.find(recipe => {
    const normalizedRecipeTitle = normalizeName(recipe.title);
    return normalizedRecipeTitle === normalizedIngredient;
  }) || null;
}

/**
 * Проверяет, является ли ингредиент компонентом (рецептом)
 */
export function isComponentRecipe(
  ingredient: Ingredient,
  allRecipes: Recipe[]
): boolean {
  return findRecipeByIngredientName(ingredient.name, allRecipes) !== null;
}

/**
 * Получает рецепт-компонент для ингредиента
 */
export function getComponentRecipe(
  ingredient: Ingredient,
  allRecipes: Recipe[]
): Recipe | null {
  return findRecipeByIngredientName(ingredient.name, allRecipes);
}

/**
 * Извлекает названия компонентов из текста шага рецепта
 * Ищет совпадения названий рецептов в тексте
 */
export function extractComponentNamesFromText(
  text: string,
  allRecipes: Recipe[]
): Array<{ name: string; recipe: Recipe; startIndex: number; endIndex: number }> {
  const matches: Array<{ name: string; recipe: Recipe; startIndex: number; endIndex: number }> = [];
  const normalizedText = text.toLowerCase();
  
  for (const recipe of allRecipes) {
    const normalizedTitle = normalizeName(recipe.title);
    
    // Ищем точное совпадение названия рецепта в тексте
    let searchIndex = 0;
    while (true) {
      const index = normalizedText.indexOf(normalizedTitle, searchIndex);
      if (index === -1) break;
      
      matches.push({
        name: recipe.title,
        recipe,
        startIndex: index,
        endIndex: index + normalizedTitle.length,
      });
      
      searchIndex = index + 1;
    }
  }
  
  // Сортируем по позиции в тексте
  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

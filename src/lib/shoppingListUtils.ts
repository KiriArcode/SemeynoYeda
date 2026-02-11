/**
 * Правила списка покупок: минимум 500 г / 500 мл.
 * Используется в generateShoppingList и при ручном добавлении.
 */

export const MIN_WEIGHT_G = 500;
export const MIN_VOLUME_ML = 500;

/** Применяет минимум 500 г для веса и 500 мл для объёма; остальные единицы не меняет. */
export function applyMinWeightOrVolume(item: {
  totalAmount: number;
  unit: string;
}): { totalAmount: number } {
  const u = item.unit;
  if (u === 'г') {
    return { totalAmount: Math.max(item.totalAmount, MIN_WEIGHT_G) };
  }
  if (u === 'кг') {
    const grams = item.totalAmount * 1000;
    const minGrams = Math.max(grams, MIN_WEIGHT_G);
    return { totalAmount: minGrams / 1000 };
  }
  if (u === 'мл') {
    return { totalAmount: Math.max(item.totalAmount, MIN_VOLUME_ML) };
  }
  if (u === 'л') {
    const ml = item.totalAmount * 1000;
    const minMl = Math.max(ml, MIN_VOLUME_ML);
    return { totalAmount: minMl / 1000 };
  }
  return { totalAmount: item.totalAmount };
}

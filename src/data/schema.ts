/** Член семьи */
export type FamilyMember = 'kolya' | 'kristina' | 'both';

/** Диетический тег */
export type DietTag =
  | 'gastritis-safe'    // щадящее для гастрита
  | 'soft-texture'      // мягкая текстура
  | 'rich-feel'         // ощущение "богатой" еды
  | 'freezable'         // можно заморозить
  | 'quick'             // <15 минут
  | 'prep-day';         // заготовка выходного дня

/** Приём пищи */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** Единица измерения */
export type Unit = 'г' | 'кг' | 'мл' | 'л' | 'шт' | 'ст.л.' | 'ч.л.' | 'стакан' | 'щепотка' | 'по вкусу';

/** Кухонное оборудование */
export type EquipmentId =
  | 'stove'       // газовая плита
  | 'oven'        // духовка
  | 'air-grill'   // аэрогриль
  | 'e-grill'     // электрогриль
  | 'steamer'     // пароварка
  | 'blender'     // блендер (+ насадка пюре)
  | 'mixer'       // планетарный миксер
  | 'grinder'     // гриндер
  | 'vacuum'      // вакууматор
  | 'bowls';      // миски

/** Использование оборудования в шаге рецепта */
export interface EquipmentUsage {
  id: EquipmentId;
  label: string;            // "Духовка", "Пароварка"
  settings?: string;        // "180°C", "режим пар", "средний огонь"
  duration?: number;        // минуты работы
}

/** Ингредиент */
export interface Ingredient {
  name: string;
  amount: number;
  unit: Unit;
  optional?: boolean;
  note?: string;              // "отварить!", "мягкий"
}

/** Статус наличия ингредиента */
export type IngredientAvailability = 'available' | 'missing' | 'unknown';

/** Ингредиент с отметкой наличия */
export interface IngredientWithAvailability extends Ingredient {
  availability?: IngredientAvailability;
  markedMissingAt?: string;  // ISO date когда отмечен как отсутствующий
}

/** Шаг рецепта */
export interface RecipeStep {
  order: number;
  text: string;
  equipment?: EquipmentUsage;   // какое оборудование используется
  duration?: number;            // минуты на этот шаг
  parallel?: boolean;           // можно делать параллельно с другим шагом
  tip?: string;                 // подсказка ("пока варится — формуйте котлеты")
}

/** Рецепт */
export interface Recipe {
  id: string;                 // nanoid
  slug: string;               // url-friendly имя
  title: string;
  subtitle?: string;          // "база для Коли", "для Кристины"
  category: 'main' | 'sauce' | 'side' | 'breakfast' | 'snack' | 'soup' | 'dessert';
  tags: DietTag[];
  suitableFor: FamilyMember;
  prepTime: number;           // минуты
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  equipment: EquipmentId[];   // список всего нужного оборудования
  notes?: string;             // заметки, советы
  storage: {
    fridge?: number;          // дней в холодильнике
    freezer?: number;         // месяцев в морозилке
    vacuumSealed?: boolean;   // упаковано вакууматором (дольше хранится)
  };
  source?: string;            // откуда рецепт
  imageUrl?: string;
  createdAt: string;          // ISO date
  updatedAt: string;
}

/** Слот в меню */
export interface MealSlot {
  mealType: MealType;
  recipes: {
    recipeId: string;
    forWhom: FamilyMember;
    variation?: string;       // "с кабачковым соусом вместо сырного"
    missingIngredients?: string[];  // названия отсутствующих ингредиентов
  }[];
}

/** День в меню */
export interface MenuDay {
  date: string;               // "2025-01-20"
  dayOfWeek: string;
  meals: MealSlot[];
}

/** Настройки покупок */
export interface ShoppingSettings {
  shoppingDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  autoGenerate: boolean;  // автоматическая генерация списка
}

/** Недельное меню */
export interface WeekMenu {
  id: string;
  weekStart: string;          // ISO date понедельника
  days: MenuDay[];
  shoppingListGenerated: boolean;
  shoppingSettings?: ShoppingSettings;
  shoppingDay?: string;  // ISO date дня покупок
  createdAt: string;
}

/** Элемент списка покупок */
export interface ShoppingItem {
  ingredient: string;
  totalAmount: number;
  unit: Unit;
  category: 'мясо' | 'молочка' | 'овощи' | 'крупы' | 'другое';
  checked: boolean;
  recipeIds: string[];        // в каких рецептах используется
  markedMissing?: boolean;  // отмечен как отсутствующий
  markedAt?: string;  // когда отмечен
  source: 'auto' | 'manual' | 'missing';  // откуда добавлен
}

/** Элемент морозилки */
export interface FreezerItem {
  id: string;
  recipeId: string;
  name: string;
  portions: number;
  frozenDate: string;
  expiryDate: string;
  location?: string;          // "верхняя полка", "ящик 2"
}

/** Задача подготовки */
export interface PrepTask {
  id: string;
  ingredient: string;
  action: 'chop' | 'slice' | 'dice' | 'mince' | 'marinate' | 'soak' | 'other';
  description: string;  // "Нарезать кубиками 1см"
  amount: number;
  unit: Unit;
  recipes: string[];  // ID рецептов, где используется
  order: number;  // порядок выполнения
  group: 'vegetables' | 'meat' | 'dairy' | 'grains' | 'other';  // группа для группировки
  canPrepareAhead: boolean;  // можно подготовить заранее
  storageTime?: number;  // часов хранения после подготовки
}

/** План подготовки */
export interface PrepPlan {
  id: string;
  date: string;  // ISO date
  tasks: PrepTask[];
  estimatedTime: number;  // минуты
  completedTasks: string[];  // ID выполненных задач
}

/** Активный таймер готовки */
export interface CookingTimer {
  id: string;
  recipeId: string;
  stepOrder: number;  // номер шага рецепта
  label: string;  // "Варить пюре"
  duration: number;  // секунды
  startTime: number;  // timestamp начала
  endTime: number;  // timestamp окончания
  isActive: boolean;
  isCompleted: boolean;
}

/** Сессия готовки */
export interface CookingSession {
  id: string;
  date: string;  // ISO date
  mealType: MealType;
  recipes: string[];  // ID рецептов
  timers: CookingTimer[];
  startedAt?: string;  // ISO date
  completedAt?: string;
}

/** Настройки режима повара */
export interface ChefModeSettings {
  id: string;
  enabled: boolean;
  showPrepBlock: boolean;
  showParallelCooking: boolean;
  defaultPrepTime: number;  // минут до готовки для подготовки
}

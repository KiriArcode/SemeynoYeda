/** Член семьи */
export type FamilyMember = 'kolya' | 'kristina' | 'both';

/** Диетический тег */
export type DietTag =
  | 'gastritis-safe'    // щадящее для гастрита
  | 'soft-texture'      // мягкая текстура
  | 'rich-feel'         // ощущение "богатой" еды
  | 'freezable'         // можно заморозить
  | 'quick'             // <15 минут
  | 'prep-day'          // заготовка выходного дня
  | 'batch-cooking'     // массовая готовка в выходной + фасовка (Main/Side)
  | 'overnight'         // можно приготовить с вечера
  | 'packable'          // можно взять с собой
  | 'low-calorie'       // низкокалорийное
  | 'blanch-before-freeze'  // бланширование перед заморозкой
  | 'double-coating';   // двойное покрытие: сначала бланширование в молоке (убирает запах), потом готовка с соусом

/** Приём пищи */
export type MealType =
  | 'breakfast'
  | 'second_breakfast'  // второй завтрак (5-6 приёмов)
  | 'lunch'
  | 'snack'
  | 'dinner'
  | 'late_snack';      // второй ужин (5-6 приёмов)

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

/** Оценка Wabba (свайп вправо/влево) */
export type WabbaRating = 'like' | 'dislike';

/** Оценки Wabba по участникам */
export interface WabbaRatings {
  kolya?: WabbaRating;
  kristina?: WabbaRating;
}

/** Инструкция разогрева для конкретного члена семьи */
export interface ReheatingInstruction {
  forWhom: FamilyMember;
  method: string;               // "Пароварка 25 мин"
  equipment: EquipmentId;
  temperature?: string;         // "180°C"
  duration: number;             // минуты
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
  reheating?: ReheatingInstruction[];  // инструкции разогрева
  version?: number;           // версия seed-рецепта для условной синхронизации
  source?: string;            // откуда рецепт
  imageUrl?: string;
  createdAt: string;          // ISO date
  updatedAt: string;
  wabbaRatings?: WabbaRatings; // оценки Wabba (Коля/Кристина)
  excludedFromMenu?: boolean;  // оба свайпнули влево — не участвует в меню
}

/** Использование компонента из морозилки */
export interface FreezerUsage {
  freezerItemId: string;
  portions: number;
}

/** Слот в меню */
export interface MealSlot {
  mealType: MealType;
  recipes: {
    recipeId: string;
    forWhom: FamilyMember;
    variation?: string;       // "с кабачковым соусом вместо сырного"
    missingIngredients?: string[];  // названия отсутствующих ингредиентов
    usesFromFreezer?: FreezerUsage[];  // компоненты из морозилки
    coffeeOnly?: boolean;     // только кофе, пропустить готовку
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
  id: string;                 // первичный ключ в IndexedDB и для sync
  ingredient: string;
  totalAmount: number;
  unit: Unit;
  category: 'мясо' | 'молочка' | 'овощи' | 'крупы' | 'другое';
  checked: boolean;
  recipeIds: string[];        // в каких рецептах используется
  markedMissing?: boolean;    // отмечен как отсутствующий
  markedAt?: string;          // когда отмечен
  source: 'auto' | 'manual' | 'missing';  // откуда добавлен
  coveredByFreezer?: boolean; // покрыто морозилкой
}

/** Элемент морозилки */
export interface FreezerItem {
  id: string;
  recipeId: string;
  name: string;
  portions: number;           // обратная совместимость
  portionsRemaining: number;
  portionsOriginal: number;
  batchId?: string;           // ID партии заготовки
  frozenDate: string;
  expiryDate: string;
  location?: string;          // "верхняя полка", "ящик 2"
  forWhom?: FamilyMember;     // персонализированный пакет: для Коли / Кристины / обоих
  reheating?: ReheatingInstruction[];
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

/** Уровень вложенности: 1 = из меню, 2 = компонент (соус/бульон), 3 = компонент компонента */
export type NestingLevel = 1 | 2 | 3;

/** Задача batch cooking (заготовки) */
export interface BatchTask {
  id: string;
  recipeId: string;
  recipeTitle: string;
  phase: 1 | 2 | 3 | 4;       // час/фаза
  phaseLabel: string;           // "Фарш", "Параллельно", "Пюре и соусы", "Упаковка"
  equipment: EquipmentId;
  step: string;                 // описание задачи
  duration: number;             // минуты
  portions: number;             // сколько порций заготавливаем
  portionsByMember?: { kolya: number; kristina: number };  // персональные пакеты
  completed: boolean;
  /** Уровень вложенности: 1 — из меню, 2 — бульоны/соусы, 3 — компоненты соусов (напр. бульон в соусе) */
  nestingLevel?: NestingLevel;
  /** Выполненная задача из старого плана, которой нет в новом — показывать внизу с кнопкой «Удалить» */
  isOrphan?: boolean;
}

/** План batch cooking */
export interface BatchPlan {
  id: string;
  date: string;
  tasks: BatchTask[];
  totalTime: number;            // минуты
  completedTasks: string[];
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
  kolyaMealsMode?: '4' | '5-6';  // 4 приёма или 5-6 (second_breakfast, late_snack)
}

// ─── Sync metadata (используется в IndexedDB для offline-first) ─────

export interface SyncMetadata {
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncedAt?: string;
  localUpdatedAt: string;
  retryCount?: number;
  errorMessage?: string;
}

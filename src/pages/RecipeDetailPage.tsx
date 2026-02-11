import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { logger } from '../lib/logger';
import type { Recipe, DietTag, FamilyMember, EquipmentId } from '../data/schema';
import { Pencil, Trash2, CheckCircle2, Snowflake } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { getComponentRecipe, extractComponentNamesFromText } from '../lib/recipeNesting';
import { useMultipleComponentAvailability } from '../hooks/useComponentAvailability';

const TAG_LABELS: Record<DietTag, string> = {
  'gastritis-safe': 'Щадящее',
  'soft-texture': 'Мягкая текстура',
  'rich-feel': 'Сытное',
  'freezable': 'Можно заморозить',
  'quick': 'Быстро',
  'prep-day': 'Заготовка',
  'batch-cooking': 'Массовая готовка',
  'overnight': 'С вечера',
  'packable': 'С собой',
  'low-calorie': 'Низкокалорийное',
  'blanch-before-freeze': 'Бланширование перед заморозкой',
  'double-coating': 'Двойное покрытие',
};

const MEMBER_LABELS: Record<FamilyMember, string> = {
  kolya: 'Коля',
  kristina: 'Кристина',
  both: 'Оба',
};

const MEMBER_BADGE: Record<string, React.CSSProperties> = {
  kolya: { background: 'rgba(0,229,255,0.10)', color: '#00E5FF', borderColor: 'rgba(0,229,255,0.25)' },
  kristina: { background: 'rgba(255,107,157,0.10)', color: '#FF6B9D', borderColor: 'rgba(255,107,157,0.25)' },
  both: { background: 'rgba(57,255,20,0.10)', color: '#39FF14', borderColor: 'rgba(57,255,20,0.25)' },
};

const EQUIPMENT_LABELS: Record<EquipmentId, string> = {
  stove: 'Плита',
  oven: 'Духовка',
  'air-grill': 'Аэрогриль',
  'e-grill': 'Электрогриль',
  steamer: 'Пароварка',
  blender: 'Блендер',
  mixer: 'Миксер',
  grinder: 'Гриндер',
  vacuum: 'Вакууматор',
  bowls: 'Миски',
};

const EQUIPMENT_ICONS: Record<string, string> = {
  stove: '🔥', oven: '🔥', 'air-grill': '🌀', 'e-grill': '🔌',
  steamer: '♨️', blender: '🔪', mixer: '🧩', grinder: '⚙️',
  vacuum: '📦', bowls: '🥣',
};

function getTagStyle(tag: DietTag): string {
  switch (tag) {
    case 'gastritis-safe': return 'bg-[#0D2818] text-portal border-[#1A4030]';
    case 'freezable': return 'bg-[#0D1B28] text-frost border-[#1A3040]';
    case 'quick': return 'bg-[#281A0D] text-accent-orange border-[#403020]';
    case 'prep-day': return 'bg-[#1A0D28] text-plasma border-[#2D1A40]';
    case 'batch-cooking': return 'bg-[#1A1A28] text-plasma border-[#2D2D40]';
    case 'overnight': return 'bg-[#1A0D28] text-plasma border-[#2D1A40]';
    case 'packable': return 'bg-[#281A0D] text-accent-orange border-[#403020]';
    case 'rich-feel': return 'bg-[#280D1A] text-kristina border-[#401A2D]';
    case 'low-calorie': return 'bg-[#0D2818] text-portal border-[#1A4030]';
    case 'blanch-before-freeze': return 'bg-[#0D1B28] text-frost border-[#1A3040]';
    case 'double-coating': return 'bg-[#1A1B28] text-matcha border-[#2A3040]';
    default: return 'bg-nebula text-text-dim border-text-ghost';
  }
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecipe(id);
      loadAllRecipes();
    }
  }, [id]);

  async function loadRecipe(recipeId: string) {
    try {
      const loaded = await dataService.recipes.get(recipeId);
      setRecipe(loaded || null);
    } catch (error) {
      logger.error('Failed to load recipe:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllRecipes() {
    try {
      const recipes = await dataService.recipes.list();
      setAllRecipes(recipes);
    } catch (error) {
      logger.error('Failed to load all recipes:', error);
    }
  }

  // Get component availability for all ingredients
  const componentAvailabilities = useMultipleComponentAvailability(
    recipe?.ingredients || [],
    allRecipes
  );

  async function handleDelete() {
    if (!recipe) return;
    logger.log('[RecipeDetailPage] Deleting recipe:', recipe.title);
    await dataService.recipes.delete(recipe.id);
    navigate('/recipes');
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-4">
          <div className="text-text-mid font-body">Загрузка рецепта...</div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="bg-dimension border border-nebula rounded-card p-5">
          <p className="text-text-mid font-body">Рецепт не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      {/* Sector label + category breadcrumb */}
      <div className="mb-2">
        <span className="text-[10px] font-mono text-portal-dim tracking-[1.5px] uppercase">
          РЕЦЕПТ · {recipe.category === 'sauce' ? 'СОУС' : recipe.category === 'main' ? 'ОСНОВНОЕ' : recipe.category === 'side' ? 'ГАРНИР' : recipe.category === 'breakfast' ? 'ЗАВТРАК' : recipe.category === 'snack' ? 'ПЕРЕКУС' : recipe.category === 'soup' ? 'СУП' : recipe.category === 'dessert' ? 'ДЕСЕРТ' : String(recipe.category).toUpperCase()}
        </span>
      </div>

      {/* Заголовок + кнопки редактирования */}
      <div className="flex items-start justify-between mb-2">
        <h1 className="font-heading text-2xl font-extrabold text-text-primary flex-1">
          {recipe.title}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to={`/recipe/${recipe.id}/edit`}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-heading font-semibold text-portal border border-portal/40 rounded-button hover:bg-portal/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Изменить
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-heading font-semibold text-ramen border border-ramen/40 rounded-button hover:bg-ramen/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Удалить
          </button>
        </div>
      </div>

      {recipe.subtitle && (
        <p className="text-text-secondary font-body mb-3">{recipe.subtitle}</p>
      )}

      {/* Для кого и теги */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <span
          className="text-xs px-3 py-1 font-heading font-semibold border rounded-full"
          style={{ ...MEMBER_BADGE[recipe.suitableFor] }}
        >
          {MEMBER_LABELS[recipe.suitableFor]}
        </span>
        {recipe.tags.map((tag) => (
          <span key={tag} className={`text-xs px-3 py-1 font-heading border rounded-full ${getTagStyle(tag)}`}>
            {TAG_LABELS[tag] || tag}
          </span>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="flex mb-6 bg-card border border-elevated rounded-button overflow-hidden">
        <div className="flex-1 py-2.5 px-2 text-center">
          <div className="text-base mb-0.5">⏱</div>
          <div className="text-[10px] font-mono text-text-muted">Время</div>
          <div className="text-sm font-heading font-bold text-text-primary">{recipe.totalTime} мин</div>
        </div>
        <div className="flex-1 py-2.5 px-2 text-center border-l border-elevated">
          <div className="text-base mb-0.5">🍽</div>
          <div className="text-[10px] font-mono text-text-muted">Порции</div>
          <div className="text-sm font-heading font-bold text-text-primary">{recipe.servings}</div>
        </div>
        {recipe.storage.fridge && (
          <div className="flex-1 py-2.5 px-2 text-center border-l border-elevated">
            <div className="text-base mb-0.5">🧊</div>
            <div className="text-[10px] font-mono text-text-muted">Холод.</div>
            <div className="text-sm font-heading font-bold text-text-primary">{recipe.storage.fridge} дн.</div>
          </div>
        )}
        {recipe.storage.freezer && (
          <div className="flex-1 py-2.5 px-2 text-center border-l border-elevated">
            <div className="text-base mb-0.5">❄️</div>
            <div className="text-[10px] font-mono text-text-muted">Мороз.</div>
            <div className="text-sm font-heading font-bold text-text-primary">
              {recipe.storage.freezer} мес.{recipe.storage.vacuumSealed ? ' 📦' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Equipment Cards */}
      {recipe.equipment.length > 0 && (
        <div className="mb-6">
          <span className="block text-[10px] font-mono text-portal-dim tracking-[1.5px] mb-2 uppercase">
            Оборудование
          </span>
          <div className="flex flex-wrap gap-2">
            {recipe.equipment.map((eq) => {
              const icon = EQUIPMENT_ICONS[eq] || '🔧';
              const label = EQUIPMENT_LABELS[eq] || eq;
              // Find settings from recipe steps
              const stepWithEq = recipe.steps.find(s => s.equipment?.id === eq);
              const settings = stepWithEq?.equipment?.settings;
              return (
                <div key={eq} className="flex items-center gap-2 bg-card border border-elevated rounded-button py-2.5 px-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="text-[13px] font-heading font-semibold text-text-primary">{label}</div>
                    {settings && (
                      <div className="text-[10px] font-mono text-text-muted">{settings}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Разогрев */}
      {recipe.reheating && recipe.reheating.length > 0 && (
        <div className="bg-card border border-elevated rounded-card p-5 mb-6 shadow-card">
          <h3 className="text-sm font-heading font-semibold text-text-primary mb-2">Разогрев из морозилки</h3>
          <div className="space-y-2">
            {recipe.reheating.map((rh, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-body text-text-secondary">
                <span
                  className="px-2 py-0.5 font-heading font-semibold border rounded-full"
                  style={{ ...MEMBER_BADGE[rh.forWhom] }}
                >
                  {MEMBER_LABELS[rh.forWhom]}
                </span>
                <span>{rh.method}</span>
                <span className="font-mono text-portal">{rh.duration} мин</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ингредиенты */}
      <div className="bg-card border border-elevated rounded-card p-5 mb-6 shadow-card">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Ингредиенты</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => {
            const componentRecipe = getComponentRecipe(ingredient, allRecipes);
            const availability = componentAvailabilities.get(ingredient.name);
            const isComponent = !!componentRecipe;
            const isAvailable = availability?.isAvailable || false;
            const isFrozen = availability?.isFrozen || false;

            return (
              <li key={index} className="flex items-center gap-2 text-text-secondary font-body">
                <span className="text-portal">•</span>
                <span className="flex-1">
                  {ingredient.amount} {ingredient.unit}{' '}
                  {isComponent ? (
                    <Link
                      to={`/recipe/${componentRecipe.id}`}
                      className="text-portal hover:text-portal-dim underline font-semibold transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ingredient.name}
                    </Link>
                  ) : (
                    ingredient.name
                  )}
                  {ingredient.note && <span className="text-text-muted"> ({ingredient.note})</span>}
                </span>
                    {isComponent && (
                      <div className="flex items-center gap-1.5">
                        {isAvailable && (
                          <div className="flex items-center gap-1" title="Есть готовый">
                            <CheckCircle2 className="w-4 h-4 text-portal" />
                            {isFrozen && <Snowflake className="w-3.5 h-3.5 text-frost" aria-label="Заморожен" />}
                          </div>
                        )}
                        {!isAvailable && (
                          <span className="text-xs text-text-muted" title="Требует приготовления">
                            ⚙️
                          </span>
                        )}
                      </div>
                    )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Шаги */}
      <div className="bg-card border border-elevated rounded-card p-5 shadow-card">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Приготовление</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step) => {
            const componentMatches = extractComponentNamesFromText(step.text, allRecipes);
            
            // Render step text with clickable component links
            const renderStepText = () => {
              if (componentMatches.length === 0) {
                return <p className="text-text-primary font-body mb-1">{step.text}</p>;
              }

              const parts: React.ReactNode[] = [];
              let lastIndex = 0;

              componentMatches.forEach((match, idx) => {
                // Add text before match
                if (match.startIndex > lastIndex) {
                  parts.push(
                    <span key={`text-${idx}`}>
                      {step.text.substring(lastIndex, match.startIndex)}
                    </span>
                  );
                }

                // Add clickable component link
                parts.push(
                  <Link
                    key={`link-${idx}`}
                    to={`/recipe/${match.recipe.id}`}
                    className="text-portal hover:text-portal-dim underline font-semibold transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {match.name}
                  </Link>
                );

                lastIndex = match.endIndex;
              });

              // Add remaining text
              if (lastIndex < step.text.length) {
                parts.push(
                  <span key="text-end">{step.text.substring(lastIndex)}</span>
                );
              }

              return <p className="text-text-primary font-body mb-1">{parts}</p>;
            };

            return (
              <li key={step.order} className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-rift border border-elevated flex items-center justify-center text-sm font-heading font-semibold text-portal">
                  {step.order}
                </span>
                <div className="flex-1">
                  {renderStepText()}
                  {step.equipment && (
                    <p className="text-sm text-text-muted font-body">
                      {step.equipment.label}{step.equipment.settings && ` · ${step.equipment.settings}`}
                    </p>
                  )}
                  {step.duration && <p className="text-xs font-mono text-portal mt-1">⏱ {step.duration} мин</p>}
                  {step.parallel && <span className="inline-block text-[10px] font-mono text-accent-cyan mt-1 mr-2">⚡ парал.</span>}
                  {step.tip && (
                    <div className="mt-1.5 px-2.5 py-1.5 bg-portal-soft border-l-2 border-portal rounded text-xs text-portal font-body">
                      💡 {step.tip}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {recipe.notes && (
        <div className="bg-card border border-elevated rounded-card p-5 mt-6 shadow-card">
          <h3 className="font-heading font-semibold text-text-primary mb-2">Заметки</h3>
          <p className="text-text-secondary font-body">{recipe.notes}</p>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удалить рецепт?"
        footer={
          <>
            <button onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-rift border border-nebula text-text-mid font-heading font-semibold text-sm rounded-button hover:bg-nebula transition-colors">
              Отмена
            </button>
            <button onClick={handleDelete}
              className="px-4 py-2 bg-ramen text-void font-heading font-semibold text-sm rounded-button hover:bg-ramen/80 transition-colors">
              Удалить
            </button>
          </>
        }
      >
        <p>Рецепт «{recipe.title}» будет удалён без возможности восстановления.</p>
      </Modal>
    </div>
  );
}

// default export for React.lazy()
export default RecipeDetailPage;

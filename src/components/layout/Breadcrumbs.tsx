import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

/**
 * Строит хлебные крошки на основе текущего маршрута.
 * Обрабатывает специальные случаи:
 *   /recipe/:id     → Меню > Рецепты > Рецепт
 *   /recipes        → Меню > Рецепты
 *   /settings/chef  → Меню > Настройки повара
 */
function buildCrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'Меню', path: '/' }];
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return [];

  // /recipe/:id → Меню > Рецепты > Рецепт
  if (segments[0] === 'recipe' && segments.length >= 2) {
    crumbs.push({ label: 'Рецепты', path: '/recipes' });
    crumbs.push({ label: 'Рецепт', path: pathname });
    return crumbs;
  }

  // /settings/chef → Меню > Настройки повара
  if (segments[0] === 'settings' && segments[1] === 'chef') {
    crumbs.push({ label: 'Настройки повара', path: '/settings/chef' });
    return crumbs;
  }

  // Стандартные маршруты
  const LABELS: Record<string, string> = {
    recipes: 'Рецепты',
    shopping: 'Покупки',
    freezer: 'Морозилка',
    prep: 'Подготовка',
    cooking: 'Готовка',
  };

  const label = LABELS[segments[0]];
  if (label) {
    crumbs.push({ label, path: `/${segments[0]}` });
  }

  return crumbs;
}

export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();

  const crumbs = buildCrumbs(location.pathname);

  // На главной не показываем хлебные крошки
  if (crumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => { console.log('[Breadcrumbs] Navigate back'); navigate(-1); }}
        className="flex items-center gap-1 px-2 py-1 text-xs font-heading font-semibold text-text-mid bg-rift border border-nebula rounded-button hover:bg-nebula hover:text-text-light hover:border-portal/30 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Назад
      </button>

      <div className="flex items-center gap-1 text-xs font-body text-text-dim overflow-x-auto">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={crumb.path} className="flex items-center gap-1 whitespace-nowrap">
              {index > 0 && <ChevronRight className="w-3 h-3 text-text-ghost flex-shrink-0" />}
              {isLast ? (
                <span className="text-text-light font-semibold">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-portal transition-colors"
                >
                  {index === 0 ? (
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {crumb.label}
                    </span>
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

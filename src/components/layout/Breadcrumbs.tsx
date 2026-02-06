import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Меню',
  'recipes': 'Рецепты',
  'recipe': 'Рецепт',
  'shopping': 'Покупки',
  'freezer': 'Морозилка',
  'prep': 'Подготовка',
  'cooking': 'Готовка',
  'settings': 'Настройки',
  'chef': 'Режим повара',
};

export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();

  // Разбиваем путь на сегменты
  const segments = location.pathname.split('/').filter(Boolean);

  // На главной не показываем хлебные крошки
  if (segments.length === 0) return null;

  // Строим крошки
  const crumbs: { label: string; path: string }[] = [
    { label: 'Меню', path: '/' },
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = ROUTE_LABELS[segment] || segment;
    crumbs.push({ label, path: currentPath });
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => navigate(-1)}
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

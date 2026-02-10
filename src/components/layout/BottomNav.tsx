import { Link, useLocation } from 'react-router-dom';
import { useChefMode } from '../../contexts/ChefModeContext';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const NORMAL_MODE_NAV: NavItem[] = [
  { icon: '📅', label: 'Меню', path: '/' },
  { icon: '📖', label: 'Рецепты', path: '/recipes' },
  { icon: '❄️', label: 'Морозилка', path: '/freezer' },
  { icon: '🛒', label: 'Покупки', path: '/shopping' },
];

const CHEF_MODE_NAV: NavItem[] = [
  { icon: '📅', label: 'Меню', path: '/' },
  { icon: '📖', label: 'Рецепты', path: '/recipes' },
  { icon: '📦', label: 'Заготовки', path: '/prep' },
  { icon: '❄️', label: 'Морозилка', path: '/freezer' },
  { icon: '🛒', label: 'Покупки', path: '/shopping' },
];

export function BottomNav() {
  const location = useLocation();
  const { enabled } = useChefMode();

  const navItems = enabled ? CHEF_MODE_NAV : NORMAL_MODE_NAV;

  function isActive(path: string): boolean {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search.includes(query.split('=')[1]);
    }
    return location.pathname.startsWith(path);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="flex mx-auto max-w-[360px] bg-panel border border-elevated rounded-modal p-1.5 backdrop-blur-[12px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 pb-2 relative cursor-pointer transition-all rounded-lg gap-[3px] ${
                active ? 'bg-portal-soft' : ''
              }`}
            >
              <span
                className="text-lg transition-all"
                style={{ filter: active ? 'none' : 'grayscale(0.6) opacity(0.4)' }}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-heading font-bold tracking-wide ${
                active ? 'text-portal' : 'text-text-muted'
              }`}>
                {item.label}
              </span>
              {active && (
                <div
                  className="absolute bottom-1 w-4 h-0.5 rounded-[1px] bg-portal shadow-[0_0_8px_rgba(57,255,20,0.4)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

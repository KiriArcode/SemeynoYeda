import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../../lib/db';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const NORMAL_MODE_NAV: NavItem[] = [
  { icon: '🗓️', label: 'Меню', path: '/' },
  { icon: '📖', label: 'Рецепты', path: '/recipes' },
  { icon: '🧊', label: 'Морозилка', path: '/freezer' },
  { icon: '🛒', label: 'Покупки', path: '/shopping' },
];

const CHEF_MODE_NAV: NavItem[] = [
  { icon: '📖', label: 'Рецепты', path: '/recipes' },
  { icon: '📦', label: 'Заготовки', path: '/recipes?tag=prep-day' },
  { icon: '🔪', label: 'Подготовка', path: '/prep' },
  { icon: '🍳', label: 'Готовка', path: '/cooking' },
];

export function BottomNav() {
  const location = useLocation();
  const [chefModeEnabled, setChefModeEnabled] = useState(false);

  useEffect(() => {
    loadChefMode();
    const interval = setInterval(loadChefMode, 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadChefMode() {
    try {
      const settings = await db.table('chefSettings').get('default');
      if (settings) {
        setChefModeEnabled(settings.enabled);
      }
    } catch (error) {
      console.error('Failed to load chef mode:', error);
    }
  }

  const navItems = chefModeEnabled ? CHEF_MODE_NAV : NORMAL_MODE_NAV;

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
    <nav className="fixed bottom-0 left-0 right-0 bg-dimension border-t border-nebula shadow-nav z-50">
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] transition-colors relative ${
                  active
                    ? 'text-portal'
                    : 'text-text-ghost'
                }`}
              >
                {active && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-portal shadow-glow rounded-t-full" />
                )}
                <span className="text-xl mb-1">{item.icon}</span>
                <span className={`text-xs font-heading font-semibold ${active ? 'text-portal' : 'text-text-ghost'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

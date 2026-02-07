import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefModeToggle } from './ChefModeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { useChefMode } from '../../contexts/ChefModeContext';

interface PageShellProps {
  children: ReactNode;
  showChefToggle?: boolean;
}

interface SectionLink {
  path: string;
  label: string;
  icon: string;
}

const NORMAL_SECTIONS: SectionLink[] = [
  { path: '/', label: 'Меню недели', icon: '🗓️' },
  { path: '/recipes', label: 'Рецепты', icon: '📖' },
  { path: '/freezer', label: 'Морозилка', icon: '🧊' },
  { path: '/shopping', label: 'Покупки', icon: '🛒' },
];

const CHEF_SECTIONS: SectionLink[] = [
  { path: '/', label: 'Меню недели', icon: '🗓️' },
  { path: '/recipes', label: 'Рецепты', icon: '📖' },
  { path: '/prep', label: 'Заготовки', icon: '📦' },
  { path: '/freezer', label: 'Морозилка', icon: '🧊' },
  { path: '/shopping', label: 'Покупки', icon: '🛒' },
];

export function PageShell({ children, showChefToggle = true }: PageShellProps) {
  const { enabled } = useChefMode();
  const location = useLocation();

  const sections = enabled ? CHEF_SECTIONS : NORMAL_SECTIONS;

  function isActive(path: string): boolean {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-void relative">
      {/* Portal blobs background decoration */}
      <div className="portal-blobs">
        <div className="portal-blob-1" />
        <div className="portal-blob-2" />
        <div className="portal-blob-3" />
      </div>

      {/* Top header bar */}
      {showChefToggle && (
        <header className="sticky top-0 z-50 border-b shadow-nav" style={{ background: 'rgba(11,14,20,0.93)', backdropFilter: 'blur(12px)', borderColor: '#161C2A' }}>
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <Link to="/" className="font-heading text-base font-extrabold text-text-light hover:text-portal transition-colors">
              SemeynoYeda
            </Link>
            <ChefModeToggle />
          </div>

          {/* Permanent section navigation */}
          <div className="container mx-auto px-2 pb-1">
            <div className="flex items-center overflow-x-auto" style={{ gap: '2px' }}>
              {sections.map((section) => {
                const active = isActive(section.path);
                return (
                  <Link
                    key={section.path}
                    to={section.path}
                    className={`flex items-center whitespace-nowrap px-3 py-1.5 text-xs font-heading font-semibold transition-all border-b-2 ${
                      active
                        ? 'text-portal border-portal'
                        : 'text-text-ghost border-transparent hover:text-text-mid hover:border-nebula'
                    }`}
                    style={{ gap: '4px' }}
                  >
                    <span className="text-sm">{section.icon}</span>
                    <span>{section.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </header>
      )}

      <main className={`pb-20 relative z-10 ${enabled ? 'chef-mode' : 'normal-mode'}`}>
        <div className="container mx-auto px-4 pt-3">
          <Breadcrumbs />
        </div>
        {children}
      </main>
    </div>
  );
}

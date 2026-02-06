import { ReactNode } from 'react';
import { ChefModeToggle } from './ChefModeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { useChefMode } from '../../contexts/ChefModeContext';

interface PageShellProps {
  children: ReactNode;
  showChefToggle?: boolean;
}

export function PageShell({ children, showChefToggle = true }: PageShellProps) {
  const { enabled } = useChefMode();

  return (
    <div className="min-h-screen bg-void">
      {showChefToggle && (
        <header className="sticky top-0 z-50 bg-dimension border-b border-nebula shadow-nav">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-text-light">
              SemeynoYeda
            </h1>
            <ChefModeToggle />
          </div>
        </header>
      )}
      <main className={`${enabled ? 'chef-mode' : 'normal-mode'}`}>
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumbs />
        </div>
        {children}
      </main>
    </div>
  );
}

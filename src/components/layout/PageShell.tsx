import { useState, useEffect, ReactNode } from 'react';
import { db } from '../../lib/db';
import { ChefModeToggle } from './ChefModeToggle';

interface PageShellProps {
  children: ReactNode;
  showChefToggle?: boolean;
}

export function PageShell({ children, showChefToggle = true }: PageShellProps) {
  const [chefModeEnabled, setChefModeEnabled] = useState(false);

  useEffect(() => {
    loadChefMode();
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

  // Подписка на изменения настроек режима повара
  useEffect(() => {
    const interval = setInterval(() => {
      loadChefMode();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
      <main className={`${chefModeEnabled ? 'chef-mode' : 'normal-mode'}`}>
        {children}
      </main>
    </div>
  );
}

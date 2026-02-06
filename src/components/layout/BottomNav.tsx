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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'BottomNav.tsx:component-mount',
        message: 'BottomNav mounted',
        data: { pathname: location.pathname, chefModeEnabled },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
  }, []);
  // #endregion

  useEffect(() => {
    loadChefMode();
    const interval = setInterval(loadChefMode, 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadChefMode() {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'BottomNav.tsx:loadChefMode-entry',
        message: 'loadChefMode called',
        data: {},
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
    // #endregion
    try {
      const settings = await db.table('chefSettings').get('default');
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'BottomNav.tsx:loadChefMode-after-db',
          message: 'Chef settings loaded',
          data: { settings: settings ? { enabled: settings.enabled } : null },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B'
        })
      }).catch(() => {});
      // #endregion
      if (settings) {
        setChefModeEnabled(settings.enabled);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'BottomNav.tsx:loadChefMode-error',
          message: 'Error loading chef mode',
          data: { error: String(error) },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B'
        })
      }).catch(() => {});
      // #endregion
      console.error('Failed to load chef mode:', error);
    }
  }

  const navItems = chefModeEnabled ? CHEF_MODE_NAV : NORMAL_MODE_NAV;
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'BottomNav.tsx:navItems-update',
        message: 'Nav items determined',
        data: { chefModeEnabled, navItemsCount: navItems.length, navItems: navItems.map(i => i.path) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      })
    }).catch(() => {});
  }, [chefModeEnabled, navItems]);
  // #endregion

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

  console.log('[DEBUG] BottomNav rendering:', { navItemsCount: navItems.length, chefModeEnabled, location: location.pathname });
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dimension border-t border-nebula shadow-nav z-50" style={{ minHeight: '60px' }}>
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.path);
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: 'BottomNav.tsx:nav-item-render',
                message: 'Rendering nav item',
                data: { path: item.path, label: item.label, active, currentPath: location.pathname },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'B'
              })
            }).catch(() => {});
            // #endregion
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  console.log('[DEBUG] Nav link clicked:', { path: item.path, label: item.label, currentPath: location.pathname });
                  // #region agent log
                  fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      location: 'BottomNav.tsx:nav-link-click',
                      message: 'Nav link clicked',
                      data: { path: item.path, label: item.label, currentPath: location.pathname },
                      timestamp: Date.now(),
                      sessionId: 'debug-session',
                      runId: 'run1',
                      hypothesisId: 'B'
                    })
                  }).catch(() => {});
                  // #endregion
                }}
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

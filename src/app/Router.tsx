import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { BottomNav } from '../components/layout/BottomNav';

const MenuPage = lazy(() => import('../pages/MenuPage'));
const RecipesPage = lazy(() => import('../pages/RecipesPage'));
const RecipeDetailPage = lazy(() => import('../pages/RecipeDetailPage'));
const FreezerPage = lazy(() => import('../pages/FreezerPage'));
const ShoppingPage = lazy(() => import('../pages/ShoppingPage'));
const PrepPage = lazy(() => import('../pages/PrepPage'));
const CookingPage = lazy(() => import('../pages/CookingPage'));
const ChefSettingsPage = lazy(() => import('../pages/ChefSettingsPage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="text-portal font-heading">Загрузка...</div>
    </div>
  );
}

// Определяем basename в зависимости от окружения
// В dev режиме basename пустой, в prod - '/SemeynoYeda'
// Проверяем также window.location для надежности
const getBasename = () => {
  // Сначала проверяем window.location (работает и в dev, и в prod)
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    console.log('[DEBUG] getBasename - window.pathname:', pathname);
    if (pathname.startsWith('/SemeynoYeda')) {
      console.log('[DEBUG] getBasename - using /SemeynoYeda from pathname');
      return '/SemeynoYeda';
    }
  }
  // Иначе используем env переменную
  const isProd = (import.meta as any).env?.PROD || (import.meta as any).env?.MODE === 'production';
  console.log('[DEBUG] getBasename - isProd:', isProd, 'env.PROD:', (import.meta as any).env?.PROD, 'env.MODE:', (import.meta as any).env?.MODE);
  return isProd ? '/SemeynoYeda' : '';
};
const basename = getBasename();
console.log('[DEBUG] Router basename determined:', basename);

const router = createBrowserRouter([
  {
    element: (
      <>
        <PageShell>
          <Outlet />
        </PageShell>
        <BottomNav />
      </>
    ),
    children: [
      { path: '/', element: <Suspense fallback={<LoadingFallback />}><MenuPage /></Suspense> },
      { path: '/recipes', element: <Suspense fallback={<LoadingFallback />}><RecipesPage /></Suspense> },
      { path: '/recipe/:id', element: <Suspense fallback={<LoadingFallback />}><RecipeDetailPage /></Suspense> },
      { path: '/freezer', element: <Suspense fallback={<LoadingFallback />}><FreezerPage /></Suspense> },
      { path: '/shopping', element: <Suspense fallback={<LoadingFallback />}><ShoppingPage /></Suspense> },
      { path: '/prep', element: <Suspense fallback={<LoadingFallback />}><PrepPage /></Suspense> },
      { path: '/cooking', element: <Suspense fallback={<LoadingFallback />}><CookingPage /></Suspense> },
      { path: '/settings/chef', element: <Suspense fallback={<LoadingFallback />}><ChefSettingsPage /></Suspense> },
    ],
  },
], {
  basename,
});

export function AppRouter() {
  console.log('[DEBUG] AppRouter component rendering');
  
  // #region agent log
  useEffect(() => {
    const currentBasename = getBasename();
    const isProd = (import.meta as any).env?.PROD || (import.meta as any).env?.MODE === 'production';
    const envMode = (import.meta as any).env?.MODE || 'unknown';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    console.log('[DEBUG] AppRouter mounted:', { basename: currentBasename, isProd, env: envMode, pathname, routerBasename: basename });
    fetch('http://127.0.0.1:7245/ingest/bacec0f2-4fcf-4e43-9ddc-9039aecfc526', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'Router.tsx:AppRouter-mount',
        message: 'AppRouter mounted',
        data: { basename: currentBasename, isProd, routesCount: 8 },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D'
      })
    }).catch(() => {});
  }, []);
  // #endregion
  return <RouterProvider router={router} />;
}

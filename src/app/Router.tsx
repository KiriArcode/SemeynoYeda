import { createBrowserRouter, RouterProvider, Outlet, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { BottomNav } from '../components/layout/BottomNav';
import { ChefModeProvider } from '../contexts/ChefModeContext';
import { PortalTransitionProvider } from '../contexts/PortalTransitionContext';
import { PortalLoading } from '../components/ui/PortalSpinner';

function ChunkErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : String(error);
  const isChunkError = message.includes('Failed to fetch dynamically imported module') || message.includes('Loading chunk');

  if (isChunkError) {
    // Устаревший кэш после деплоя — снимаем старый SW и перезагружаем
    if (navigator.serviceWorker?.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
        window.location.reload();
      }).catch(() => window.location.reload());
    } else {
      window.location.reload();
    }
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-portal font-heading">Обновление...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-portal font-heading text-xl">Ошибка</h2>
      <pre className="text-muted text-sm max-w-full overflow-auto">
        {isRouteErrorResponse(error) ? error.statusText : message}
      </pre>
    </div>
  );
}

const MenuPage = lazy(() => import('../pages/MenuPage'));
const RecipesPage = lazy(() => import('../pages/RecipesPage'));
const RecipeDetailPage = lazy(() => import('../pages/RecipeDetailPage'));
const RecipeNewPage = lazy(() => import('../pages/RecipeNewPage'));
const RecipeEditPage = lazy(() => import('../pages/RecipeEditPage'));
const FreezerPage = lazy(() => import('../pages/FreezerPage'));
const ShoppingPage = lazy(() => import('../pages/ShoppingPage'));
const PrepPage = lazy(() => import('../pages/PrepPage'));
const CookingPage = lazy(() => import('../pages/CookingPage'));
const ChefSettingsPage = lazy(() => import('../pages/ChefSettingsPage'));
const WabbaPage = lazy(() => import('../pages/WabbaPage'));

function LoadingFallback() {
  return <PortalLoading text="Загружаем портал..." />;
}

// Vite BASE_URL: '/' for Vercel, '/SemeynoYeda/' for GitHub Pages if needed later
const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const basename = base || '';

const router = createBrowserRouter([
  {
    errorElement: <ChunkErrorBoundary />,
    element: (
      <PortalTransitionProvider>
        <ChefModeProvider>
          <PageShell>
            <Outlet />
          </PageShell>
          <BottomNav />
        </ChefModeProvider>
      </PortalTransitionProvider>
    ),
    children: [
      { path: '/', element: <Suspense fallback={<LoadingFallback />}><MenuPage /></Suspense> },
      { path: '/recipes', element: <Suspense fallback={<LoadingFallback />}><RecipesPage /></Suspense> },
      { path: '/recipe/new', element: <Suspense fallback={<LoadingFallback />}><RecipeNewPage /></Suspense> },
      { path: '/recipe/:id', element: <Suspense fallback={<LoadingFallback />}><RecipeDetailPage /></Suspense> },
      { path: '/recipe/:id/edit', element: <Suspense fallback={<LoadingFallback />}><RecipeEditPage /></Suspense> },
      { path: '/freezer', element: <Suspense fallback={<LoadingFallback />}><FreezerPage /></Suspense> },
      { path: '/shopping', element: <Suspense fallback={<LoadingFallback />}><ShoppingPage /></Suspense> },
      { path: '/prep', element: <Suspense fallback={<LoadingFallback />}><PrepPage /></Suspense> },
      { path: '/cooking', element: <Suspense fallback={<LoadingFallback />}><CookingPage /></Suspense> },
      { path: '/settings/chef', element: <Suspense fallback={<LoadingFallback />}><ChefSettingsPage /></Suspense> },
      { path: '/wabba', element: <Suspense fallback={<LoadingFallback />}><WabbaPage /></Suspense> },
    ],
  },
], {
  basename,
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}

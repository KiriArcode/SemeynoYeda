import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { BottomNav } from '../components/layout/BottomNav';
import { ChefModeProvider } from '../contexts/ChefModeContext';

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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="text-portal font-heading">Загрузка...</div>
    </div>
  );
}

const getBasename = () => {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/SemeynoYeda')) {
      return '/SemeynoYeda';
    }
  }
  const isProd = (import.meta as any).env?.PROD || (import.meta as any).env?.MODE === 'production';
  return isProd ? '/SemeynoYeda' : '';
};
const basename = getBasename();

const router = createBrowserRouter([
  {
    element: (
      <ChefModeProvider>
        <PageShell>
          <Outlet />
        </PageShell>
        <BottomNav />
      </ChefModeProvider>
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
    ],
  },
], {
  basename,
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}

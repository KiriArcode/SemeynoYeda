import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
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
  basename: '/SemeynoYeda',
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}

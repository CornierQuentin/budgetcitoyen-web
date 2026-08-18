import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';

import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import { PageLoader } from './components/layout/PageLoader';

const Comparateur = lazy(() => import('./pages/Comparateur'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Donnees = lazy(() => import('./pages/Donnees'));
const Historique = lazy(() => import('./pages/Historique'));
const Home = lazy(() => import('./pages/Home'));
const Mission = lazy(() => import('./pages/Mission'));
const MonBudget = lazy(() => import('./pages/MonBudget'));

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'tableau-de-bord',
        element: <Dashboard />,
        children: [{ path: 'mission/:slug', element: <Mission /> }],
      },
      { path: 'historique', element: <Historique /> },
      { path: 'comparer', element: <Comparateur /> },
      { path: 'mon-budget', element: <MonBudget /> },
      { path: 'donnees', element: <Donnees /> },
    ],
  },
]);

export default router;

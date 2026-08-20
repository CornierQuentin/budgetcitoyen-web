import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';

import AppShell from './components/layout/AppShell';
import { PageLoader } from './components/layout/PageLoader';

const Comparateur = lazy(() => import('./pages/Comparateur'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DepensesFiscales = lazy(() => import('./pages/DepensesFiscales'));
const Donnees = lazy(() => import('./pages/Donnees'));
const Historique = lazy(() => import('./pages/Historique'));
const Home = lazy(() => import('./pages/Home'));
const Marches = lazy(() => import('./pages/Marches'));
const Mission = lazy(() => import('./pages/Mission'));
const MonBudget = lazy(() => import('./pages/MonBudget'));
const Simulateur = lazy(() => import('./pages/Simulateur'));

function Layout() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppShell>
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
      { path: 'simulateur', element: <Simulateur /> },
      { path: 'depenses-fiscales', element: <DepensesFiscales /> },
      { path: 'marches-publics', element: <Marches /> },
      { path: 'donnees', element: <Donnees /> },
    ],
  },
]);

export default router;

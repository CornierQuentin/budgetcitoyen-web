import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';

import AppShell from './components/layout/AppShell';
import LandingShell from './components/layout/LandingShell';
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

// Deux coques, délibérément : l'accueil présente le site (aucun rail, en-tête
// léger), les pages de données l'opèrent (rail permanent). Une page d'accueil
// posée dans la coque applicative ne peut ressembler qu'à l'onglet « home »
// d'un tableau de bord — c'est structurel, pas cosmétique.
function LayoutAccueil() {
  return (
    <LandingShell>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </LandingShell>
  );
}

function LayoutApplication() {
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
    element: <LayoutAccueil />,
    children: [{ index: true, element: <Home /> }],
  },
  {
    path: '/',
    element: <LayoutApplication />,
    children: [
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

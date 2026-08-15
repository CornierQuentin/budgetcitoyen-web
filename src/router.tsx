import { createBrowserRouter, Outlet } from 'react-router-dom';

import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import Comparateur from './pages/Comparateur';
import Dashboard from './pages/Dashboard';
import Donnees from './pages/Donnees';
import Historique from './pages/Historique';
import Home from './pages/Home';
import Mission from './pages/Mission';
import MonBudget from './pages/MonBudget';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
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

import { Outlet } from 'react-router-dom';

import BudgetTreemap from '../components/charts/BudgetTreemap';
import DonutChart from '../components/charts/DonutChart';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BudgetTreemap data={[]} />
        <DonutChart data={[]} />
      </section>

      <Outlet />
    </div>
  );
}


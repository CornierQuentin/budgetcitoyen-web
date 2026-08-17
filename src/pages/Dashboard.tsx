import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import BudgetTreemap from '../components/charts/BudgetTreemap';
import DonutChart from '../components/charts/DonutChart';
import { useAnnees } from '../hooks/useAnnees';
import { useMissions } from '../hooks/useMissions';
import { useRecettes } from '../hooks/useRecettes';
import { useFiltersStore } from '../store/useFiltersStore';
import { formatMd } from '../utils/format';

export default function Dashboard() {
  const anneeActive = useFiltersStore((state) => state.anneeActive);
  const setAnneeActive = useFiltersStore((state) => state.setAnneeActive);

  const { data: annees } = useAnnees();

  // La valeur par défaut du store (année civile en cours) ne correspond pas
  // forcément à une année réellement chargée en base : on se recale sur la
  // plus récente disponible dès que la liste des années arrive.
  useEffect(() => {
    if (annees && annees.length > 0 && !annees.some((item) => item.annee === anneeActive)) {
      setAnneeActive(Math.max(...annees.map((item) => item.annee)));
    }
  }, [annees, anneeActive, setAnneeActive]);

  const { data: missions } = useMissions(anneeActive);
  const { data: recettes } = useRecettes(anneeActive);

  const treemapData = (missions ?? []).map((mission) => ({
    slug: mission.slug,
    nom: mission.nomOfficiel,
    montant: mission.montantTotal,
  }));

  const donutData = (recettes ?? []).map((recette) => ({
    label: recette.type,
    value: recette.montantNet,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

        {annees && annees.length > 0 && (
          <label htmlFor="annee-dashboard" className="text-sm font-medium text-gray-700">
            Année
            <select
              id="annee-dashboard"
              value={anneeActive}
              onChange={(event) => setAnneeActive(Number(event.target.value))}
              className="ml-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {annees
                .map((item) => item.annee)
                .sort((a, b) => b - a)
                .map((annee) => (
                  <option key={annee} value={annee}>
                    {annee}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Dépenses par mission
            {missions && missions.length > 0 && (
              <span className="ml-2 font-normal text-gray-500">
                (total {formatMd(missions.reduce((sum, mission) => sum + mission.montantTotal, 0))})
              </span>
            )}
          </h2>
          <BudgetTreemap data={treemapData} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Recettes par type</h2>
          <DonutChart data={donutData} />
        </div>
      </section>

      <Outlet />
    </div>
  );
}

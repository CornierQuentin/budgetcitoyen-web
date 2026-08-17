import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import BudgetTreemap from '../components/charts/BudgetTreemap';
import DonutChart from '../components/charts/DonutChart';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
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
  // Ni /missions ni /recettes n'exposent de sourceUrl propre : les totaux
  // agrégés affichés ci-dessous renvoient donc vers la source officielle du
  // budget de l'année (même donnée d'origine), via /budget/{annee}.
  const { data: budgetAnnee } = useBudgetAnnee(anneeActive);

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tableau de bord</h1>

        {annees && annees.length > 0 && (
          <label
            htmlFor="annee-dashboard"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Année
            <select
              id="annee-dashboard"
              value={anneeActive}
              onChange={(event) => setAnneeActive(Number(event.target.value))}
              className="ml-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600
                dark:bg-gray-800 dark:text-gray-100"
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
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Dépenses par mission
            {missions && missions.length > 0 && (
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                (total {formatMd(missions.reduce((sum, mission) => sum + mission.montantTotal, 0))})
                {budgetAnnee && (
                  <SourceIcon url={budgetAnnee.sourceUrl} label={`missions ${anneeActive}`} />
                )}
              </span>
            )}
          </h2>
          <BudgetTreemap data={treemapData} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Recettes par type
            {budgetAnnee && (
              <SourceIcon url={budgetAnnee.sourceUrl} label={`recettes ${anneeActive}`} />
            )}
          </h2>
          <DonutChart data={donutData} />
        </div>
      </section>

      <Outlet />
    </div>
  );
}

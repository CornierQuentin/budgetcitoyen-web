import { useEffect, useRef } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';

import BudgetTreemap from '../components/charts/BudgetTreemap';
import DonutChart from '../components/charts/DonutChart';
import { Button } from '../components/ui/Button';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissions } from '../hooks/useMissions';
import { useRecettes } from '../hooks/useRecettes';
import { useFiltersStore } from '../store/useFiltersStore';
import { exportCsv } from '../utils/exportCsv';
import { formatMd } from '../utils/format';
import { parseIntSearchParam } from '../utils/searchParams';

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

  const [searchParams, setSearchParams] = useSearchParams();
  // `anneeActive` vit dans un store Zustand partagé avec la page Historique :
  // au montage, on n'applique le `?annee=` de l'URL que s'il diffère de
  // l'année déjà active (héritée d'une navigation précédente), pour ne
  // jamais forcer de redirection entre les deux pages. Le flag évite que
  // l'effet de synchronisation URL <- état (ci-dessous) n'écrase cette
  // lecture initiale avec la valeur (obsolète) du rendu précédant la mise à
  // jour du store.
  const skipProchaineEcritureUrl = useRef(false);
  useEffect(() => {
    const parsed = parseIntSearchParam(searchParams.get('annee'));
    if (parsed !== undefined && parsed !== anneeActive) {
      skipProchaineEcritureUrl.current = true;
      setAnneeActive(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Répercute l'année active dans l'URL de cette page, pour la rendre
  // partageable.
  useEffect(() => {
    if (skipProchaineEcritureUrl.current) {
      skipProchaineEcritureUrl.current = false;
      return;
    }
    if (searchParams.get('annee') === String(anneeActive)) return;
    const next = new URLSearchParams(searchParams);
    next.set('annee', String(anneeActive));
    setSearchParams(next, { replace: true });
  }, [anneeActive, searchParams, setSearchParams]);

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

  const handleExportMissionsCsv = () => {
    exportCsv(treemapData, `missions-${anneeActive}.csv`, [
      { cle: 'nom', libelle: 'Mission' },
      { cle: 'montant', libelle: 'Montant (€)' },
    ]);
  };

  const handleExportRecettesCsv = () => {
    exportCsv(donutData, `recettes-${anneeActive}.csv`, [
      { cle: 'label', libelle: 'Type de recette' },
      { cle: 'value', libelle: 'Montant net (€)' },
    ]);
  };

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
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dépenses par mission
              {missions && missions.length > 0 && (
                <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                  (total{' '}
                  {formatMd(missions.reduce((sum, mission) => sum + mission.montantTotal, 0))})
                  {budgetAnnee && (
                    <SourceIcon url={budgetAnnee.sourceUrl} label={`missions ${anneeActive}`} />
                  )}
                </span>
              )}
            </h2>
            {treemapData.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={handleExportMissionsCsv}
              >
                Exporter CSV
              </Button>
            )}
          </div>
          <BudgetTreemap data={treemapData} nomFichierExport={`missions-${anneeActive}.png`} />
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recettes par type
              {budgetAnnee && (
                <SourceIcon url={budgetAnnee.sourceUrl} label={`recettes ${anneeActive}`} />
              )}
            </h2>
            {donutData.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={handleExportRecettesCsv}
              >
                Exporter CSV
              </Button>
            )}
          </div>
          <DonutChart data={donutData} nomFichierExport={`recettes-${anneeActive}.png`} />
        </div>
      </section>

      <Outlet />
    </div>
  );
}

import { useEffect, useMemo } from 'react';

import LineChart from '../components/charts/LineChart';
import { Card } from '../components/ui/Card';
import { useHistorique } from '../hooks/useHistorique';
import { useFiltersStore } from '../store/useFiltersStore';
import { formatMd } from '../utils/format';

export default function Historique() {
  const anneeActive = useFiltersStore((state) => state.anneeActive);
  const setAnneeActive = useFiltersStore((state) => state.setAnneeActive);

  const { data: historique } = useHistorique();

  const annees = useMemo(
    () => (historique ?? []).map((item) => item.annee).sort((a, b) => a - b),
    [historique],
  );
  const anneeMin = annees[0];
  const anneeMax = annees[annees.length - 1];

  // Recale l'année active sur une année réellement disponible dans la série,
  // dès que celle-ci est chargée (le store est initialisé sur l'année civile
  // en cours, qui n'a pas forcément de données).
  useEffect(() => {
    if (annees.length > 0 && !annees.includes(anneeActive)) {
      setAnneeActive(anneeMax);
    }
  }, [annees, anneeActive, anneeMax, setAnneeActive]);

  const data = (historique ?? []).map((item) => ({
    annee: item.annee,
    depenses: item.depensesNettes,
    recettes: item.recettesNettes,
    deficit: item.deficit,
  }));

  const anneeSelectionnee = historique?.find((item) => item.annee === anneeActive);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Historique</h1>

      <LineChart data={data} />

      {annees.length > 0 && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="annee-historique"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Année sélectionnée : {anneeActive}
            </label>
            <input
              id="annee-historique"
              type="range"
              min={anneeMin}
              max={anneeMax}
              value={anneeActive}
              onChange={(event) => setAnneeActive(Number(event.target.value))}
              className="mt-2 w-full max-w-md"
            />
          </div>

          {anneeSelectionnee && (
            <Card className="max-w-sm">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Année {anneeSelectionnee.annee}
              </p>
              <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <dt>Dépenses nettes</dt>
                  <dd>{formatMd(anneeSelectionnee.depensesNettes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Recettes nettes</dt>
                  <dd>{formatMd(anneeSelectionnee.recettesNettes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Déficit</dt>
                  <dd>{formatMd(anneeSelectionnee.deficit)}</dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

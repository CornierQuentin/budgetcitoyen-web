import { useEffect, useState } from 'react';

import { Card } from '../components/ui/Card';
import { useAnnees } from '../hooks/useAnnees';
import { useComparateur } from '../hooks/useComparateur';
import { formatMd, formatPct } from '../utils/format';

export default function Comparateur() {
  const { data: annees } = useAnnees();
  const anneesDisponibles = (annees ?? []).map((item) => item.annee).sort((a, b) => b - a);

  const [anneeA, setAnneeA] = useState<number | undefined>(undefined);
  const [anneeB, setAnneeB] = useState<number | undefined>(undefined);

  // Par défaut : compare les deux dernières années disponibles, dès que la
  // liste des années arrive.
  useEffect(() => {
    if (anneesDisponibles.length > 0 && anneeA === undefined && anneeB === undefined) {
      setAnneeB(anneesDisponibles[0]);
      setAnneeA(anneesDisponibles[1] ?? anneesDisponibles[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annees]);

  const { data: comparateur } = useComparateur(anneeA, anneeB);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Comparateur</h1>

      <div className="flex flex-wrap gap-6">
        <div>
          <label htmlFor="annee-a" className="block text-sm font-medium text-gray-700">
            Année A
            <select
              id="annee-a"
              value={anneeA ?? ''}
              onChange={(event) => setAnneeA(Number(event.target.value))}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {anneesDisponibles.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label htmlFor="annee-b" className="block text-sm font-medium text-gray-700">
            Année B
            <select
              id="annee-b"
              value={anneeB ?? ''}
              onChange={(event) => setAnneeB(Number(event.target.value))}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {anneesDisponibles.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {comparateur && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500">Écart de dépenses</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatMd(comparateur.ecartDepenses)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Écart de recettes</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatMd(comparateur.ecartRecettes)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Écart de déficit</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatMd(comparateur.ecartDeficit)}
              </p>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Missions — {anneeA} vs {anneeB}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Triées par écart absolu décroissant : les plus fortes hausses en tête, les plus
              fortes baisses en bas.
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-gray-700">
                      Mission
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      {anneeA}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      {anneeB}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      Écart
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      Écart %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparateur.missions.map((mission) => (
                    <tr key={mission.slug}>
                      <td className="px-3 py-2 text-gray-900">{mission.nom}</td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {formatMd(mission.montantA)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {formatMd(mission.montantB)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-medium ${
                          mission.deltaAbsolu >= 0 ? 'text-red-700' : 'text-green-700'
                        }`}
                      >
                        {mission.deltaAbsolu >= 0 ? '+' : ''}
                        {formatMd(mission.deltaAbsolu)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {mission.deltaRelatifPct !== null
                          ? formatPct(mission.deltaRelatifPct / 100)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Recettes par type — {anneeA} vs {anneeB}
            </h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-gray-700">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      {anneeA}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      {anneeB}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      Écart
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                      Écart %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparateur.recettes.map((recette) => (
                    <tr key={recette.type}>
                      <td className="px-3 py-2 text-gray-900">{recette.type}</td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {recette.montantA !== null ? formatMd(recette.montantA) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {recette.montantB !== null ? formatMd(recette.montantB) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">
                        {recette.deltaAbsolu !== null ? (
                          <span className={recette.deltaAbsolu >= 0 ? 'text-red-700' : 'text-green-700'}>
                            {recette.deltaAbsolu >= 0 ? '+' : ''}
                            {formatMd(recette.deltaAbsolu)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {recette.deltaRelatifPct !== null
                          ? formatPct(recette.deltaRelatifPct / 100)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Un écart affiché « — » signifie que la donnée n&apos;est pas disponible pour l&apos;une
              des deux années comparées.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

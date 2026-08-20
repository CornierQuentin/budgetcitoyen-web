import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useAnnees } from '../hooks/useAnnees';
import { useComparateur } from '../hooks/useComparateur';
import { useExportPng } from '../hooks/useExportPng';
import type { MissionDelta, RecetteDelta } from '../types/domain';
import { exportCsv } from '../utils/exportCsv';
import { formatMd, formatPct } from '../utils/format';
import { parseIntSearchParam } from '../utils/searchParams';

// Normalise une chaîne pour une recherche insensible à la casse et aux
// accents (ex : "defense" doit trouver "Défense").
function normaliserPourRecherche(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export default function Comparateur() {
  const { data: annees } = useAnnees();
  const anneesDisponibles = (annees ?? []).map((item) => item.annee).sort((a, b) => b - a);

  const [searchParams, setSearchParams] = useSearchParams();

  // La query string est lue une seule fois à l'initialisation (état React
  // ensuite source de vérité, réécrit vers l'URL par l'effet ci-dessous) :
  // cela évite toute boucle de synchronisation URL <-> état.
  const [anneeA, setAnneeA] = useState<number | undefined>(() =>
    parseIntSearchParam(searchParams.get('annee_a')),
  );
  const [anneeB, setAnneeB] = useState<number | undefined>(() =>
    parseIntSearchParam(searchParams.get('annee_b')),
  );

  // Par défaut (aucune année dans l'URL au chargement) : compare les deux
  // dernières années disponibles, dès que la liste des années arrive.
  useEffect(() => {
    if (anneesDisponibles.length > 0 && anneeA === undefined && anneeB === undefined) {
      setAnneeB(anneesDisponibles[0]);
      setAnneeA(anneesDisponibles[1] ?? anneesDisponibles[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annees]);

  // Répercute la sélection dans l'URL (`?annee_a=...&annee_b=...`), pour que
  // la vue soit partageable. Garde d'égalité avant écriture : sans elle,
  // `setSearchParams` créerait une nouvelle entrée d'historique à chaque
  // rendu et provoquerait une boucle de mise à jour.
  useEffect(() => {
    if (anneeA === undefined || anneeB === undefined) return;
    if (
      searchParams.get('annee_a') === String(anneeA) &&
      searchParams.get('annee_b') === String(anneeB)
    ) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('annee_a', String(anneeA));
    next.set('annee_b', String(anneeB));
    setSearchParams(next, { replace: true });
  }, [anneeA, anneeB, searchParams, setSearchParams]);

  const { data: comparateur } = useComparateur(anneeA, anneeB);

  // Filtre d'affichage du tableau des missions (~30 lignes triées par écart
  // décroissant) : ne touche pas à l'export CSV, qui doit toujours contenir
  // toutes les missions, filtrées ou non (cf. handleExportMissionsCsv).
  const [rechercheMission, setRechercheMission] = useState('');
  const rechercheNormalisee = normaliserPourRecherche(rechercheMission.trim());
  const missionsFiltrees = (comparateur?.missions ?? []).filter(
    (mission) =>
      rechercheNormalisee === '' ||
      normaliserPourRecherche(mission.nom).includes(rechercheNormalisee),
  );

  const {
    ref: comparatifRef,
    exporterPng,
    enCours: exportPngEnCours,
  } = useExportPng<HTMLDivElement>();

  const handleExportMissionsCsv = () => {
    if (!comparateur) return;
    exportCsv<MissionDelta>(
      comparateur.missions,
      `comparateur-missions-${anneeA}-vs-${anneeB}.csv`,
      [
        { cle: 'nom', libelle: 'Mission' },
        { cle: 'montantA', libelle: `Montant ${anneeA} (€)` },
        { cle: 'montantB', libelle: `Montant ${anneeB} (€)` },
        { cle: 'deltaAbsolu', libelle: 'Écart (€)' },
        { cle: 'deltaRelatifPct', libelle: 'Écart (%)' },
      ],
    );
  };

  const handleExportRecettesCsv = () => {
    if (!comparateur) return;
    exportCsv<RecetteDelta>(
      comparateur.recettes,
      `comparateur-recettes-${anneeA}-vs-${anneeB}.csv`,
      [
        { cle: 'type', libelle: 'Type de recette' },
        { cle: 'montantA', libelle: `Montant ${anneeA} (€)` },
        { cle: 'montantB', libelle: `Montant ${anneeB} (€)` },
        { cle: 'deltaAbsolu', libelle: 'Écart (€)' },
        { cle: 'deltaRelatifPct', libelle: 'Écart (%)' },
      ],
    );
  };

  const handleExportPng = () => {
    exporterPng(`comparateur-${anneeA}-vs-${anneeB}.png`);
  };

  // Un écart provient de deux sources officielles (une par année comparée) :
  // on affiche les deux icônes source côte à côte plutôt que d'en choisir
  // une arbitrairement.
  const sourcesEcart = comparateur && (
    <>
      <SourceIcon url={comparateur.anneeA.sourceUrl} label={`année ${anneeA}`} />
      <SourceIcon url={comparateur.anneeB.sourceUrl} label={`année ${anneeB}`} />
    </>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Comparateur</h1>

      <div className="flex flex-wrap gap-6">
        <div>
          <label
            htmlFor="annee-a"
            className="block text-sm font-medium text-ink-muted"
          >
            Année A
            <select
              id="annee-a"
              value={anneeA ?? ''}
              onChange={(event) => setAnneeA(Number(event.target.value))}
              className="mt-1 block rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
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
          <label
            htmlFor="annee-b"
            className="block text-sm font-medium text-ink-muted"
          >
            Année B
            <select
              id="annee-b"
              value={anneeB ?? ''}
              onChange={(event) => setAnneeB(Number(event.target.value))}
              className="mt-1 block rounded-md border border-line-strong px-3 py-1.5 text-sm
                "
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
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleExportPng}
              disabled={exportPngEnCours}
            >
              {exportPngEnCours ? 'Export en cours…' : 'Exporter PNG du comparatif'}
            </Button>
          </div>

          <div ref={comparatifRef} className="space-y-6 bg-white p-1 ">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <p className="text-sm text-ink-muted">Écart de dépenses</p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {formatMd(comparateur.ecartDepenses)}
                  {sourcesEcart}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-ink-muted">Écart de recettes</p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {formatMd(comparateur.ecartRecettes)}
                  {sourcesEcart}
                </p>
              </Card>
              <Card>
                <p className="text-sm text-ink-muted">
                  Écart de <GlossaryTerm term="déficit">déficit</GlossaryTerm>
                </p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {formatMd(comparateur.ecartDeficit)}
                  {sourcesEcart}
                </p>
              </Card>
            </section>

            <section>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-ink">
                  Missions — {anneeA} vs {anneeB}
                  {sourcesEcart}
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1 text-xs"
                  onClick={handleExportMissionsCsv}
                >
                  Exporter CSV
                </Button>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Triées par écart absolu décroissant : les plus fortes hausses en tête, les plus
                fortes baisses en bas. En <span className="text-neg">rouge</span>,
                une hausse de dépenses ; en <span className="text-pos">vert</span>,
                une baisse.
              </p>
              <div className="mt-3 max-w-sm">
                <label
                  htmlFor="recherche-mission"
                  className="block text-sm font-medium text-ink-muted"
                >
                  Rechercher une mission
                  <input
                    id="recherche-mission"
                    type="search"
                    value={rechercheMission}
                    onChange={(event) => setRechercheMission(event.target.value)}
                    placeholder="Ex. Défense, Enseignement scolaire…"
                    className="mt-1 block w-full rounded-md border border-line-strong px-3 py-1.5 text-sm
                      "
                  />
                </label>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                <table className="min-w-full divide-y divide-line text-sm ">
                  <thead className="bg-surface-sunken">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-ink-muted"
                      >
                        Mission
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        {anneeA}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        {anneeB}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        Écart
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        Écart %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {missionsFiltrees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-ink-muted"
                        >
                          Aucune mission ne correspond à « {rechercheMission.trim()} ».
                        </td>
                      </tr>
                    ) : (
                      missionsFiltrees.map((mission) => (
                        <tr key={mission.slug}>
                          <td className="px-3 py-2 text-ink">
                            {mission.nom}
                          </td>
                          <td className="px-3 py-2 text-right text-ink-muted">
                            {formatMd(mission.montantA)}
                          </td>
                          <td className="px-3 py-2 text-right text-ink-muted">
                            {formatMd(mission.montantB)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-medium ${
                              mission.deltaAbsolu >= 0
                                ? 'text-neg'
                                : 'text-pos'
                            }`}
                          >
                            {mission.deltaAbsolu >= 0 ? '+' : ''}
                            {formatMd(mission.deltaAbsolu)}
                          </td>
                          <td className="px-3 py-2 text-right text-ink-muted">
                            {mission.deltaRelatifPct !== null
                              ? formatPct(mission.deltaRelatifPct / 100)
                              : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-ink">
                  Recettes par type — {anneeA} vs {anneeB}
                  {sourcesEcart}
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1 text-xs"
                  onClick={handleExportRecettesCsv}
                >
                  Exporter CSV
                </Button>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                En <span className="text-pos">vert</span>, une hausse de
                recettes ; en <span className="text-neg">rouge</span>, une
                baisse.
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                <table className="min-w-full divide-y divide-line text-sm ">
                  <thead className="bg-surface-sunken">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-ink-muted"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        {anneeA}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        {anneeB}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        Écart
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-ink-muted"
                      >
                        Écart %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {comparateur.recettes.map((recette) => (
                      <tr key={recette.type}>
                        <td className="px-3 py-2 text-ink">
                          <GlossaryTerm term={recette.type}>{recette.type}</GlossaryTerm>
                        </td>
                        <td className="px-3 py-2 text-right text-ink-muted">
                          {recette.montantA !== null ? formatMd(recette.montantA) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-ink-muted">
                          {recette.montantB !== null ? formatMd(recette.montantB) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-ink-muted">
                          {recette.deltaAbsolu !== null ? (
                            <span
                              // Convention inversée par rapport au tableau des missions :
                              // pour une recette, une hausse est une bonne nouvelle
                              // (plus de recettes perçues) donc verte ; une baisse est
                              // rouge. Retour utilisateur explicite.
                              className={
                                recette.deltaAbsolu >= 0
                                  ? 'text-pos'
                                  : 'text-neg'
                              }
                            >
                              {recette.deltaAbsolu >= 0 ? '+' : ''}
                              {formatMd(recette.deltaAbsolu)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-ink-muted">
                          {recette.deltaRelatifPct !== null
                            ? formatPct(recette.deltaRelatifPct / 100)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Un écart affiché « — » signifie que la donnée n&apos;est pas disponible pour
                l&apos;une des deux années comparées.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

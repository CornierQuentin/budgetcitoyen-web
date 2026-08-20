import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom';

import DonutChart from '../components/charts/DonutChart';
import { PageLoader } from '../components/layout/PageLoader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissions } from '../hooks/useMissions';
import { useRecettes } from '../hooks/useRecettes';
import { useFiltersStore } from '../store/useFiltersStore';
import type { TypeRecette } from '../types/domain';
import { exportCsv } from '../utils/exportCsv';
import { formatMd, formatPct } from '../utils/format';
import { parseIntSearchParam } from '../utils/searchParams';
import { topNAvecAutres } from '../utils/topNAvecAutres';

const NB_MISSIONS_DISTINCTES = 8;

const SIGLES_RECETTES: TypeRecette[] = ['IR', 'TVA', 'IS', 'TICPE', 'AUTRES'];

// Rampe d'une seule teinte pour les 5 types de recettes : série courte et
// ordonnable, donc la quantité se lit à la valeur. Valeurs littérales et non
// `var(--data-*)` : l'export PNG rasterise le graphique hors du document, où
// une variable CSS n'a pas toujours de valeur résolue — ces deux tableaux
// doivent donc rester alignés à la main sur `--data-1..5` de src/index.css.
const RAMPE_RECETTES_CLAIR = ['#16326b', '#244d99', '#3d6ec4', '#7b9ad9', '#b9caea'];
const RAMPE_RECETTES_SOMBRE = ['#b9caea', '#7b9ad9', '#4f7fd0', '#35589c', '#253c6b'];

/**
 * Écart signé en Md€, pour une variation d'une année sur l'autre. Le signe
 * négatif est laissé à `formatMd` (donc à Intl) plutôt qu'ajouté à la main :
 * un signe moins typographique écrit ici jurerait avec le trait d'union que
 * produit Intl partout ailleurs sur la page.
 */
function formatEcart(valeur: number): string {
  return valeur >= 0 ? `+${formatMd(valeur)}` : formatMd(valeur);
}

export default function Dashboard() {
  const anneeActive = useFiltersStore((state) => state.anneeActive);
  const setAnneeActive = useFiltersStore((state) => state.setAnneeActive);

  const { data: annees } = useAnnees();

  useEffect(() => {
    if (annees && annees.length > 0 && !annees.some((item) => item.annee === anneeActive)) {
      setAnneeActive(Math.max(...annees.map((item) => item.annee)));
    }
  }, [annees, anneeActive, setAnneeActive]);

  const [searchParams, setSearchParams] = useSearchParams();
  const skipProchaineEcritureUrl = useRef(false);
  useEffect(() => {
    const parsed = parseIntSearchParam(searchParams.get('annee'));
    if (parsed !== undefined && parsed !== anneeActive) {
      skipProchaineEcritureUrl.current = true;
      setAnneeActive(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Le camembert des missions n'est plus la lecture principale (le tableau
  // dense l'a remplacé), mais il reste accessible à la demande : c'est lui qui
  // porte l'export PNG des dépenses, engagement du CDC (« toute visualisation
  // exportable en PNG »).
  const [camembertMissionsVisible, setCamembertMissionsVisible] = useState(false);
  const [triCroissant, setTriCroissant] = useState(false);

  const navigate = useNavigate();
  const { data: missions } = useMissions(anneeActive);
  const { data: recettes } = useRecettes(anneeActive);
  const { data: budgetAnnee } = useBudgetAnnee(anneeActive);
  // Année précédente : sert uniquement à afficher un écart à côté de chaque
  // chiffre clé. Absente en début de série (ou non chargée), l'écart n'est
  // simplement pas affiché — jamais inventé.
  const { data: budgetPrecedent } = useBudgetAnnee(anneeActive - 1);

  const estSombre = document.documentElement.classList.contains('dark');
  const rampeRecettes = estSombre ? RAMPE_RECETTES_SOMBRE : RAMPE_RECETTES_CLAIR;

  const missionsCsvData = (missions ?? []).map((mission) => ({
    nom: mission.nomOfficiel,
    montant: mission.montantTotal,
  }));

  const missionsDonutData = useMemo(
    () =>
      topNAvecAutres(
        (missions ?? []).map((mission) => ({
          label: mission.nomOfficiel,
          value: mission.montantTotal,
        })),
        NB_MISSIONS_DISTINCTES,
      ),
    [missions],
  );

  const missionsTriees = useMemo(
    () =>
      (missions ?? [])
        .slice()
        .sort((a, b) =>
          triCroissant ? a.montantTotal - b.montantTotal : b.montantTotal - a.montantTotal,
        ),
    [missions, triCroissant],
  );

  const missionsMontantMax = (missions ?? []).reduce(
    (max, mission) => Math.max(max, mission.montantTotal),
    0,
  );
  const missionsMontantTotal = (missions ?? []).reduce(
    (sum, mission) => sum + mission.montantTotal,
    0,
  );

  const slugParNomMission = useMemo(
    () => new Map((missions ?? []).map((mission) => [mission.nomOfficiel, mission.slug])),
    [missions],
  );

  const handleClicTrancheMission = (label: string) => {
    const slug = slugParNomMission.get(label);
    if (slug) navigate(`/tableau-de-bord/mission/${slug}`);
  };

  const donutDataRecettes = (recettes ?? []).map((recette) => ({
    label: recette.type,
    value: recette.montantNet,
  }));

  const handleExportMissionsCsv = () => {
    exportCsv(missionsCsvData, `missions-${anneeActive}.csv`, [
      { cle: 'nom', libelle: 'Mission' },
      { cle: 'montant', libelle: 'Montant (€)' },
    ]);
  };

  const handleExportRecettesCsv = () => {
    exportCsv(donutDataRecettes, `recettes-${anneeActive}.csv`, [
      { cle: 'label', libelle: 'Type de recette' },
      { cle: 'value', libelle: 'Montant net (€)' },
    ]);
  };

  const anneesDisponibles = (annees ?? []).map((item) => item.annee).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">
            Budget de l&apos;État — exercice {anneeActive}
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Chaque montant renvoie au texte officiel qui l&apos;établit.
          </p>
        </div>

        {anneesDisponibles.length > 0 && (
          <label
            htmlFor="annee-dashboard"
            className="ml-auto flex items-center gap-2 text-[13px] font-medium text-ink-muted"
          >
            Année
            <select
              id="annee-dashboard"
              value={anneeActive}
              onChange={(event) => setAnneeActive(Number(event.target.value))}
              className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[13px]
                font-semibold text-ink"
            >
              {anneesDisponibles.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Résumé avant détail : trois chiffres clés, chacun avec son écart sur
          l'année précédente. Aucun montant absolu n'est teinté — seul l'écart
          des recettes porte une couleur sémantique, où « plus » a un sens
          non politique (davantage de recettes perçues). */}
      {budgetAnnee && (
        <section aria-label="Chiffres clés" className="grid gap-4 sm:grid-cols-3">
          <Card className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted">
              Dépenses totales
              <SourceIcon url={budgetAnnee.sourceUrl} label={`dépenses ${anneeActive}`} />
            </span>
            <span className="text-3xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(budgetAnnee.depensesNettes)}
            </span>
            {budgetPrecedent && (
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone="quiet" className="tabular-nums">
                  {formatEcart(budgetAnnee.depensesNettes - budgetPrecedent.depensesNettes)}
                </Badge>
                <span className="text-xs text-ink-faint">vs {anneeActive - 1}</span>
              </span>
            )}
          </Card>

          <Card className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted">
              Recettes totales
              <SourceIcon url={budgetAnnee.sourceUrl} label={`recettes ${anneeActive}`} />
            </span>
            <span className="text-3xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(budgetAnnee.recettesNettes)}
            </span>
            {budgetPrecedent && (
              <span className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    budgetAnnee.recettesNettes >= budgetPrecedent.recettesNettes ? 'pos' : 'neg'
                  }
                  className="tabular-nums"
                >
                  {formatEcart(budgetAnnee.recettesNettes - budgetPrecedent.recettesNettes)}
                </Badge>
                <span className="text-xs text-ink-faint">vs {anneeActive - 1}</span>
              </span>
            )}
          </Card>

          <Card className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted">
              <GlossaryTerm term="déficit">Solde budgétaire</GlossaryTerm>
              <SourceIcon url={budgetAnnee.sourceUrl} label={`solde ${anneeActive}`} />
            </span>
            {/* L'API expose `deficit` comme une magnitude POSITIVE : le solde
                budgétaire en est l'opposé (même convention que Home.tsx, qui
                affiche `-budget.deficit`). */}
            <span className="text-3xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(-budgetAnnee.deficit)}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone="quiet">{budgetAnnee.deficit > 0 ? 'Déficit' : 'Excédent'}</Badge>
              {budgetPrecedent && (
                <span className="text-xs tabular-nums text-ink-faint">
                  Écart {formatEcart(budgetPrecedent.deficit - budgetAnnee.deficit)} vs{' '}
                  {anneeActive - 1}
                </span>
              )}
            </span>
          </Card>
        </section>
      )}

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <Card
          flush
          title="Dépenses par mission"
          note={
            missionsMontantTotal > 0 ? (
              <>
                {(missions ?? []).length} missions · {formatMd(missionsMontantTotal)}
                {budgetAnnee && (
                  <SourceIcon url={budgetAnnee.sourceUrl} label={`missions ${anneeActive}`} />
                )}
              </>
            ) : undefined
          }
          actions={
            missionsCsvData.length > 0 ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCamembertMissionsVisible((visible) => !visible)}
                  aria-expanded={camembertMissionsVisible}
                  aria-controls="camembert-missions"
                >
                  {camembertMissionsVisible ? 'Masquer le camembert' : 'Voir en camembert'}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportMissionsCsv}>
                  Exporter CSV
                </Button>
              </>
            ) : undefined
          }
        >
          {camembertMissionsVisible && (
            <div id="camembert-missions" className="border-b border-line p-4">
              <DonutChart
                data={missionsDonutData}
                nomFichierExport={`missions-${anneeActive}.png`}
                onSliceClick={handleClicTrancheMission}
              />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-line px-4 py-2.5 text-left text-[11.5px]
                      font-semibold uppercase tracking-[0.04em] text-ink-faint"
                  >
                    Mission
                  </th>
                  <th
                    scope="col"
                    aria-sort={triCroissant ? 'ascending' : 'descending'}
                    className="border-b border-line px-4 py-2.5 text-right text-[11.5px]
                      font-semibold uppercase tracking-[0.04em] text-ink"
                  >
                    <button
                      type="button"
                      onClick={() => setTriCroissant((croissant) => !croissant)}
                      className="inline-flex items-center gap-1 uppercase tracking-[0.04em]
                        hover:text-accent"
                    >
                      Montant
                      <span aria-hidden="true" className="text-accent">
                        {triCroissant ? '↑' : '↓'}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="hidden border-b border-line px-4 py-2.5 text-left text-[11.5px]
                      font-semibold uppercase tracking-[0.04em] text-ink-faint sm:table-cell"
                  >
                    Part
                  </th>
                  <th
                    scope="col"
                    className="border-b border-line px-4 py-2.5 text-right text-[11.5px]
                      font-semibold uppercase tracking-[0.04em] text-ink-faint"
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {missionsTriees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                      Aucune mission disponible pour {anneeActive}.
                    </td>
                  </tr>
                ) : (
                  missionsTriees.map((mission) => (
                    <tr
                      key={mission.slug}
                      className="border-b border-line last:border-b-0 hover:bg-surface-hover"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/tableau-de-bord/mission/${mission.slug}`}
                          className="font-medium text-ink hover:text-accent hover:underline
                            hover:underline-offset-2"
                        >
                          {mission.nomOfficiel}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-muted">
                        {formatMd(mission.montantTotal)}
                      </td>
                      {/* Redondance purement visuelle de la colonne « % » :
                          masquée aux technologies d'assistance, qui liraient
                          sinon une cellule vide de plus par ligne. */}
                      <td aria-hidden="true" className="hidden w-[140px] px-4 py-2.5 sm:table-cell">
                        <span className="block h-1.5 w-full overflow-hidden rounded-sm bg-bar-track">
                          <span
                            className="block h-full rounded-sm bg-bar"
                            style={{
                              width: `${
                                missionsMontantMax > 0
                                  ? (mission.montantTotal / missionsMontantMax) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-faint">
                        {formatPct(
                          missionsMontantTotal > 0
                            ? mission.montantTotal / missionsMontantTotal
                            : 0,
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Recettes par type"
          actions={
            donutDataRecettes.length > 0 ? (
              <Button variant="secondary" size="sm" onClick={handleExportRecettesCsv}>
                Exporter CSV
              </Button>
            ) : undefined
          }
          footer={
            donutDataRecettes.length > 0 ? (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Sigles :</span>
                {SIGLES_RECETTES.map((code) => (
                  <GlossaryTerm key={code} term={code}>
                    {code}
                  </GlossaryTerm>
                ))}
              </span>
            ) : undefined
          }
        >
          <DonutChart
            data={donutDataRecettes}
            palette={rampeRecettes}
            nomFichierExport={`recettes-${anneeActive}.png`}
          />
        </Card>
      </section>

      {/* Suspense local : Mission est chargée en lazy, sans ce boundary son
          chargement ferait disparaître toute la page derrière le repli global. */}
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

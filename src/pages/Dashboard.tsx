import {
  type MouseEvent as ReactMouseEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { formatEcartMd, formatMd, formatPct, soldeDepuisDeficit } from '../utils/format';
import { parseIntSearchParam } from '../utils/searchParams';
import { rampeSequentielle } from '../utils/rampeSequentielle';
import { topNAvecAutres } from '../utils/topNAvecAutres';

const NB_MISSIONS_DISTINCTES = 8;

const SIGLES_RECETTES: TypeRecette[] = ['IR', 'TVA', 'IS', 'TICPE', 'AUTRES'];

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

  const rampeMissions = rampeSequentielle(missionsDonutData.length, estSombre);

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

  // Toute la ligne du tableau des missions ouvre le détail, pas seulement son
  // nom : la ligne est la cible que l'oeil vise (retour utilisateur). Le
  // <Link> reste en place et garde son rôle — c'est lui qui porte l'URL
  // réelle (clic droit, ouverture dans un nouvel onglet, survol qui affiche la
  // destination) et le parcours clavier. La ligne n'ajoute qu'un raccourci à
  // la souris, sans créer de second arrêt de tabulation ni dupliquer
  // l'annonce faite aux lecteurs d'écran.
  const ouvrirMission = (event: ReactMouseEvent<HTMLTableRowElement>, slug: string) => {
    // Clic sur le lien lui-même : déjà pris en charge par React Router.
    if ((event.target as HTMLElement).closest('a')) return;
    // Ne pas emmener ailleurs quelqu'un qui vient de sélectionner un montant
    // pour le copier — le relâchement de la souris est alors un clic.
    if (window.getSelection()?.toString()) return;
    navigate(`/tableau-de-bord/mission/${slug}`);
  };

  const handleClicTrancheMission = (label: string) => {
    const slug = slugParNomMission.get(label);
    if (slug) navigate(`/tableau-de-bord/mission/${slug}`);
  };

  // Trié par montant décroissant, comme la maquette validée : la rampe de
  // couleurs du camembert ne veut dire quelque chose que si l'ordre des
  // tranches suit celui des montants.
  const donutDataRecettes = (recettes ?? [])
    .map((recette) => ({
      label: recette.type,
      value: recette.montantNet,
    }))
    .sort((a, b) => b.value - a.value);

  // Rampe d'une seule teinte : les types de recettes sont triés par montant,
  // donc la position dans la rampe redit la quantité. Couleurs littérales et
  // non `var(--data-*)` — l'export PNG rasterise le graphique hors du
  // document, où une variable CSS n'a pas toujours de valeur résolue.
  const rampeRecettes = rampeSequentielle(donutDataRecettes.length, estSombre);

  // Le camembert totalise MOINS que le chiffre clé « Recettes totales » de
  // l'en-tête, et l'écart est celui des prélèvements sur recettes (PSR) :
  // les sommes reversées aux collectivités territoriales et à l'Union
  // européenne. Le tableau d'équilibre officiel les présente en déduction des
  // recettes brutes plutôt qu'en dépense, si bien que l'API les retranche du
  // total de l'année (`AnneeBudget.recettes_nettes`) sans les stocker parmi
  // les types de recettes — les deux chiffres sont justes, ils ne mesurent
  // simplement pas la même chose. L'écart est donc DÉDUIT des deux totaux
  // réels plutôt que codé en dur, et affiché : deux chiffres qui ne tombent
  // pas juste sans explication détruisent plus de confiance que la
  // complexité qu'ils recouvrent.
  const totalRecettesAvantPsr = donutDataRecettes.reduce((somme, item) => somme + item.value, 0);
  const prelevementsSurRecettes =
    budgetAnnee !== undefined && totalRecettesAvantPsr > 0
      ? totalRecettesAvantPsr - budgetAnnee.recettesNettes
      : 0;

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
                  {formatEcartMd(budgetAnnee.depensesNettes - budgetPrecedent.depensesNettes)}
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
                  {formatEcartMd(budgetAnnee.recettesNettes - budgetPrecedent.recettesNettes)}
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
            <span className="text-3xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(soldeDepuisDeficit(budgetAnnee.deficit))}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone="quiet">{budgetAnnee.deficit > 0 ? 'Déficit' : 'Excédent'}</Badge>
              {budgetPrecedent && (
                <span className="text-xs tabular-nums text-ink-faint">
                  Écart{' '}
                  {formatEcartMd(
                    soldeDepuisDeficit(budgetAnnee.deficit) -
                      soldeDepuisDeficit(budgetPrecedent.deficit),
                  )}{' '}
                  vs {anneeActive - 1}
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
                variant="compact"
                palette={rampeMissions}
                titreAccessible="Répartition des dépenses de l'État par mission"
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
                      onClick={(event) => ouvrirMission(event, mission.slug)}
                      className="cursor-pointer border-b border-line last:border-b-0
                        hover:bg-surface-hover"
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
              <span className="flex flex-col gap-1.5">
                {prelevementsSurRecettes > 0 && (
                  <span>
                    {formatMd(totalRecettesAvantPsr)} au total, moins{' '}
                    {formatMd(prelevementsSurRecettes)} reversés aux collectivités territoriales et
                    à l&apos;Union européenne, soit les{' '}
                    {formatMd(totalRecettesAvantPsr - prelevementsSurRecettes)} de recettes nettes
                    affichés en haut de page.
                  </span>
                )}
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Sigles :</span>
                  {SIGLES_RECETTES.map((code) => (
                    <GlossaryTerm key={code} term={code}>
                      {code}
                    </GlossaryTerm>
                  ))}
                </span>
              </span>
            ) : undefined
          }
        >
          <DonutChart
            data={donutDataRecettes}
            variant="compact"
            palette={rampeRecettes}
            titreAccessible="Répartition des recettes de l'État par type"

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

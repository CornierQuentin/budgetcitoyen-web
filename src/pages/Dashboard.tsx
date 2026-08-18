import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';

import DonutChart from '../components/charts/DonutChart';
import { PageLoader } from '../components/layout/PageLoader';
import { Button } from '../components/ui/Button';
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

// Au-delà de 8 tranches, un camembert devient illisible (cf. skill dataviz :
// une palette catégorielle n'est validée que jusqu'à 8 séries) — avec une
// trentaine de missions, les 8 plus grosses restent des tranches distinctes,
// le reste est cumulé dans une tranche « Autres » (détail au survol).
const NB_MISSIONS_DISTINCTES = 8;

// Sigles affichés dans la légende du camembert des recettes : la légende est
// rendue par <Legend> de recharts (à l'intérieur de DonutChart), qui ne
// permet pas d'y injecter un composant React par entrée (ex. GlossaryTerm
// avec sa tooltip accessible au clavier). On affiche donc à la place un
// rappel des sigles juste au-dessus du graphique, chacun cliquable/focusable
// via GlossaryTerm — mêmes clés que le glossaire (src/utils/glossaire.ts) et
// que TypeRecette, pour rester aligné avec les valeurs réellement reçues de
// l'API.
const SIGLES_RECETTES: TypeRecette[] = ['IR', 'TVA', 'IS', 'TICPE', 'AUTRES'];

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

  // Repliée par défaut : une trentaine de lignes d'un coup surchargerait la
  // page à l'arrivée sur le Dashboard, alors que le camembert (top-8 +
  // Autres) suffit déjà à la lecture rapide. Un simple bouton donne accès au
  // détail complet, y compris des missions regroupées dans « Autres »
  // (retour utilisateur : ce détail n'était visible qu'au survol du
  // camembert, pas assez accessible).
  const [detailMissionsVisible, setDetailMissionsVisible] = useState(false);

  const navigate = useNavigate();
  const { data: missions } = useMissions(anneeActive);
  const { data: recettes } = useRecettes(anneeActive);
  // Ni /missions ni /recettes n'exposent de sourceUrl propre : les totaux
  // agrégés affichés ci-dessous renvoient donc vers la source officielle du
  // budget de l'année (même donnée d'origine), via /budget/{annee}.
  const { data: budgetAnnee } = useBudgetAnnee(anneeActive);

  // Liste complète (non groupée) pour l'export CSV : contrairement au
  // camembert, l'export ne perd aucune mission dans une tranche « Autres ».
  const missionsCsvData = (missions ?? []).map((mission) => ({
    nom: mission.nomOfficiel,
    montant: mission.montantTotal,
  }));

  // Regroupement top-8 + Autres pour le camembert uniquement (cf.
  // src/utils/topNAvecAutres.ts) : au-delà de 8 tranches un camembert devient
  // illisible, or une année compte une trentaine de missions.
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

  // Liste complète triée par montant décroissant, pour le détail dépliable
  // sous le camembert (cf. `detailMissionsVisible` ci-dessus) : contrairement
  // à `missionsDonutData`, aucune mission n'y est agrégée dans une tranche
  // « Autres » — c'est justement ce qui manquait au clic (le survol de la
  // tranche « Autres » du camembert n'en donnait le détail qu'au survol).
  const missionsTriees = useMemo(
    () => (missions ?? []).slice().sort((a, b) => b.montantTotal - a.montantTotal),
    [missions],
  );
  const missionsMontantMax = missionsTriees.reduce(
    (max, mission) => Math.max(max, mission.montantTotal),
    0,
  );
  const missionsMontantTotal = missionsTriees.reduce(
    (sum, mission) => sum + mission.montantTotal,
    0,
  );

  // Nom de mission -> slug, pour la navigation au clic sur une tranche : la
  // tranche « Autres » (qui ne correspond à aucune mission précise) n'a pas
  // d'entrée dans cette map, donc onSliceClick n'y déclenche aucune
  // navigation — sans avoir besoin de la distinguer explicitement par son
  // libellé.
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

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
            {missionsCsvData.length > 0 && (
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
          {missionsDonutData.length > NB_MISSIONS_DISTINCTES && (
            // min-h-8 (même valeur que la légende « Sigles » de la colonne
            // recettes, ci-dessous) : ce texte est plus long et s'enveloppe
            // sur 2 lignes là où « Sigles » tient sur 1 - sans hauteur
            // minimale partagée, les deux camemberts ne démarraient pas à la
            // même hauteur (retour utilisateur : « celui des recettes est
            // légèrement plus haut »).
            <p className="mb-2 min-h-8 text-xs text-gray-500 dark:text-gray-400">
              Les {NB_MISSIONS_DISTINCTES} missions les plus importantes sont détaillées
              individuellement ; les autres sont regroupées dans la tranche « Autres »
              (survolez-la pour le détail).
            </p>
          )}
          <DonutChart
            data={missionsDonutData}
            nomFichierExport={`missions-${anneeActive}.png`}
            onSliceClick={handleClicTrancheMission}
          />
          {missionsTriees.length > 0 && (
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={() => setDetailMissionsVisible((visible) => !visible)}
                aria-expanded={detailMissionsVisible}
                aria-controls="detail-complet-missions"
              >
                {detailMissionsVisible
                  ? 'Masquer le détail complet'
                  : `Voir le détail complet des ${missionsTriees.length} missions`}
              </Button>
              {detailMissionsVisible && (
                <ul id="detail-complet-missions" className="mt-3 space-y-1.5">
                  {missionsTriees.map((mission) => (
                    <li key={mission.slug}>
                      <button
                        type="button"
                        onClick={() => navigate(`/tableau-de-bord/mission/${mission.slug}`)}
                        className="flex w-full items-center gap-3 rounded px-1 py-1 text-left
                          text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        aria-label={`Voir le détail de la mission ${mission.nomOfficiel} : ${formatMd(mission.montantTotal)}`}
                      >
                        <span
                          className="w-56 flex-none truncate text-gray-700 dark:text-gray-300"
                          title={mission.nomOfficiel}
                        >
                          {mission.nomOfficiel}
                        </span>
                        <span className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                          <span
                            className="block h-2 rounded-full bg-blue-700 dark:bg-blue-500"
                            style={{
                              width: `${
                                missionsMontantMax > 0
                                  ? (mission.montantTotal / missionsMontantMax) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </span>
                        <span className="w-20 flex-none text-right text-gray-600 dark:text-gray-300">
                          {formatMd(mission.montantTotal)}
                        </span>
                        <span className="w-14 flex-none text-right text-gray-400 dark:text-gray-500">
                          {formatPct(
                            missionsMontantTotal > 0
                              ? mission.montantTotal / missionsMontantTotal
                              : 0,
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recettes par type
              {budgetAnnee && (
                <SourceIcon url={budgetAnnee.sourceUrl} label={`recettes ${anneeActive}`} />
              )}
            </h2>
            {donutDataRecettes.length > 0 && (
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
          {donutDataRecettes.length > 0 && (
            // min-h-8 : voir le commentaire équivalent sur la légende de la
            // colonne missions, ci-dessus (même hauteur minimale partagée).
            <p className="mb-2 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Sigles :</span>
              {SIGLES_RECETTES.map((code) => (
                <GlossaryTerm key={code} term={code}>
                  {code}
                </GlossaryTerm>
              ))}
            </p>
          )}
          <DonutChart data={donutDataRecettes} nomFichierExport={`recettes-${anneeActive}.png`} />
        </div>
      </section>

      {/* Suspense local (plutôt que de compter sur celui du routeur, plus haut
          dans l'arbre) : Mission est elle aussi chargée en lazy (React.lazy),
          sans ce boundary dédié son chargement ferait disparaître toute la
          page — camemberts déjà rendus compris — derrière le repli global le
          temps du téléchargement du chunk, au lieu de ne montrer un repli que
          pour la seule section de détail. */}
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

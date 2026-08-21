import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import LineChart, { type LineChartSerie } from '../components/charts/LineChart';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useHistorique } from '../hooks/useHistorique';
import { useMissionHistorique } from '../hooks/useMissionHistorique';
import { useMissions } from '../hooks/useMissions';
import { useSyncSearchParams } from '../hooks/useSyncSearchParams';
import { exportCsv } from '../utils/exportCsv';
import { formatEcartMd, formatMd, formatPct, soldeDepuisDeficit } from '../utils/format';

// Dépenses et recettes partagent la même teinte, déclinée en valeur, et se
// distinguent par le trait : deux couleurs voisines sont indiscernables à
// l'échelle d'un graphique, et la couleur ne doit jamais être le seul signal.
// Valeurs littérales plutôt que `var(--data-*)` : l'export PNG rasterise le
// graphique hors du document, où une variable CSS n'a pas toujours de valeur
// résolue (même contrainte que la rampe des recettes du tableau de bord).
const COULEUR_DEPENSES = '#244d99';
const COULEUR_RECETTES = '#7b9ad9';
const COULEUR_SOLDE = '#3d6ec4';

const SERIES_DEPENSES_RECETTES: LineChartSerie[] = [
  { key: 'depenses', label: 'Dépenses nettes', color: COULEUR_DEPENSES },
  { key: 'recettes', label: 'Recettes nettes', color: COULEUR_RECETTES, dash: '6 4' },
];
const SERIES_SOLDE: LineChartSerie[] = [
  { key: 'solde', label: 'Solde budgétaire', color: COULEUR_SOLDE },
];
const SERIES_MISSION: LineChartSerie[] = [
  { key: 'montant', label: 'Crédits de paiement', color: COULEUR_DEPENSES },
];

/** Nombre d'années affichées par le sélecteur de période. */
const PERIODES = [5, 10] as const;
type Periode = (typeof PERIODES)[number] | 'tout';

export default function Historique() {
  const { data: historique } = useHistorique();
  const [periode, setPeriode] = useState<Periode>('tout');

  const toutes = useMemo(
    () =>
      (historique ?? [])
        .slice()
        .sort((a, b) => a.annee - b.annee)
        .map((item) => ({
          annee: item.annee,
          depenses: item.depensesNettes,
          recettes: item.recettesNettes,
          // `deficit` reste disponible pour les calculs (magnitude, comme
          // l'API) ; `solde` est ce que l'on trace et affiche.
          deficit: item.deficit,
          solde: soldeDepuisDeficit(item.deficit),
        })),
    [historique],
  );

  const data = useMemo(
    () => (periode === 'tout' ? toutes : toutes.slice(-periode)),
    [toutes, periode],
  );

  // Repères calculés sur la période affichée, jamais figés : changer de
  // période doit changer les chiffres, sinon ils mentent.
  const reperes = useMemo(() => {
    if (data.length < 2) return undefined;
    const premier = data[0];
    const dernier = data[data.length - 1];
    const pire = data.reduce((min, item) => (item.solde < min.solde ? item : min), data[0]);
    return {
      premier,
      dernier,
      evolutionDepenses: premier.depenses > 0 ? dernier.depenses / premier.depenses - 1 : 0,
      evolutionRecettes: premier.recettes > 0 ? dernier.recettes / premier.recettes - 1 : 0,
      soldeCumule: data.reduce((somme, item) => somme + item.solde, 0),
      pire,
    };
  }, [data]);

  // Écart de SOLDE d'une année sur la précédente, pour la colonne d'évolution
  // du tableau (décroissant : l'année la plus récente en tête). Le solde
  // plutôt que les dépenses : les trois colonnes qui précèdent donnent déjà
  // les dépenses et les recettes en niveau, et c'est leur différence qui dit
  // si l'exercice s'est redressé ou dégradé. Un écart POSITIF est toujours une
  // amélioration — le solde étant signé, il vaut aussi bien pour un déficit
  // qui se réduit que pour un excédent qui grandit.
  const lignes = useMemo(
    () =>
      data
        .map((item, index) => ({
          ...item,
          ecartSolde: index > 0 ? item.solde - data[index - 1].solde : undefined,
        }))
        .slice()
        .reverse(),
    [data],
  );

  // --- Évolution d'une dépense, mission par mission -----------------------
  //
  // La liste complète (toutes années confondues, dédoublonnée par slug) plutôt
  // que celle de la dernière année : une mission créée puis supprimée est
  // précisément un cas que cette page sert à explorer, et la restreindre à
  // l'exercice en cours la rendrait invisible. Coût assumé : ~90 Ko contre 6,
  // en une requête mise en cache pour la session.
  const { data: toutesMissions } = useMissions();

  const missionsSelectionnables = useMemo(() => {
    // Un même slug apparaît une fois par année, avec le libellé officiel de
    // cette année-là. On garde celui de l'année la plus récente : c'est le nom
    // sous lequel la mission se cherche aujourd'hui.
    const parSlug = new Map<string, { slug: string; nomOfficiel: string; annee: number }>();
    (toutesMissions ?? []).forEach((mission) => {
      const connue = parSlug.get(mission.slug);
      if (connue === undefined || mission.annee > connue.annee) {
        parSlug.set(mission.slug, {
          slug: mission.slug,
          nomOfficiel: mission.nomOfficiel,
          annee: mission.annee,
        });
      }
    });
    return Array.from(parSlug.values()).sort((a, b) => a.nomOfficiel.localeCompare(b.nomOfficiel));
  }, [toutesMissions]);

  const [searchParamsInitiaux] = useSearchParams();
  const [missionChoisie, setMissionChoisie] = useState<string>(
    () => searchParamsInitiaux.get('mission') ?? '',
  );

  // Sans choix explicite, la plus grosse mission du dernier exercice : c'est
  // la courbe la plus parlante à l'ouverture, et jamais un choix arbitraire.
  const missionParDefaut = useMemo(() => {
    const derniereAnnee = (toutesMissions ?? []).reduce((max, m) => Math.max(max, m.annee), 0);
    return (toutesMissions ?? [])
      .filter((mission) => mission.annee === derniereAnnee)
      .reduce<string | undefined>(
        (meilleure, mission, _index, liste) =>
          mission.montantTotal === Math.max(...liste.map((m) => m.montantTotal))
            ? mission.slug
            : meilleure,
        undefined,
      );
  }, [toutesMissions]);

  const missionActive = missionChoisie || missionParDefaut || '';
  const { data: historiqueMission } = useMissionHistorique(missionActive || undefined);

  // Un paramètre d'URL n'est écrit que sur un choix explicite : la valeur par
  // défaut ne doit pas se figer dans l'URL partagée, sinon elle survivrait à
  // un changement de données.
  useSyncSearchParams({ mission: missionChoisie || undefined });

  const serieMission = useMemo(() => {
    const points = (historiqueMission ?? [])
      .slice()
      .sort((a, b) => a.annee - b.annee)
      .map((item) => ({ annee: item.annee, montant: item.montantTotal }));
    // Même fenêtre que le reste de la page : le sélecteur de période en tête
    // pilote tous les graphiques, sinon deux graphiques côte à côte
    // couvriraient des périodes différentes sans le dire.
    return periode === 'tout' ? points : points.slice(-periode);
  }, [historiqueMission, periode]);

  const nomMissionActive =
    missionsSelectionnables.find((mission) => mission.slug === missionActive)?.nomOfficiel ?? '';

  // Évolution sur la fenêtre affichée, jamais sur la série complète : le
  // chiffre doit suivre ce que le graphique montre.
  const evolutionMission = useMemo(() => {
    if (serieMission.length < 2) return undefined;
    const premier = serieMission[0];
    const dernier = serieMission[serieMission.length - 1];
    if (premier.montant <= 0) return undefined;
    return { premier, dernier, ratio: dernier.montant / premier.montant - 1 };
  }, [serieMission]);

  const handleExportCsv = () => {
    exportCsv(data, 'historique-depenses-recettes-deficit.csv', [
      { cle: 'annee', libelle: 'Année' },
      { cle: 'depenses', libelle: 'Dépenses nettes (€)' },
      { cle: 'recettes', libelle: 'Recettes nettes (€)' },
      { cle: 'solde', libelle: 'Solde (€)' },
    ]);
  };

  const libellePeriode = (valeur: Periode) => (valeur === 'tout' ? 'Tout' : `${valeur} ans`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Historique du budget</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Dépenses, recettes et <GlossaryTerm term="déficit">déficit</GlossaryTerm> de
            l&apos;État, année par année.
          </p>
        </div>

        {toutes.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div
              className="flex h-8 overflow-hidden rounded-md border border-line-strong"
              role="group"
              aria-label="Période affichée"
            >
              {[...PERIODES, 'tout' as const].map((valeur) => (
                <button
                  key={String(valeur)}
                  type="button"
                  onClick={() => setPeriode(valeur)}
                  aria-pressed={periode === valeur}
                  disabled={valeur !== 'tout' && toutes.length <= valeur}
                  className={`border-r border-line px-3 text-[13px] font-medium last:border-r-0
                    disabled:cursor-not-allowed disabled:opacity-40 ${
                      periode === valeur
                        ? 'bg-accent-soft font-semibold text-accent'
                        : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
                    }`}
                >
                  {libellePeriode(valeur)}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={handleExportCsv}>
              Exporter CSV
            </Button>
          </div>
        )}
      </div>

      {reperes && (
        <section
          aria-label="Repères de la période"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">
              Dépenses depuis {reperes.premier.annee}
            </span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {reperes.evolutionDepenses >= 0 ? '+' : ''}
              {formatPct(reperes.evolutionDepenses)}
            </span>
            <span className="text-xs tabular-nums text-ink-faint">
              {formatMd(reperes.premier.depenses)} → {formatMd(reperes.dernier.depenses)}
            </span>
          </Card>

          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">
              Recettes depuis {reperes.premier.annee}
            </span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {reperes.evolutionRecettes >= 0 ? '+' : ''}
              {formatPct(reperes.evolutionRecettes)}
            </span>
            <span className="text-xs tabular-nums text-ink-faint">
              {formatMd(reperes.premier.recettes)} → {formatMd(reperes.dernier.recettes)}
            </span>
          </Card>

          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">Solde cumulé</span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(reperes.soldeCumule)}
            </span>
            <span className="text-xs text-ink-faint">
              somme des {data.length} exercices affichés
            </span>
          </Card>

          <Card className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-muted">Solde le plus bas</span>
            <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
              {formatMd(reperes.pire.solde)}
            </span>
            <span className="text-xs tabular-nums text-ink-faint">en {reperes.pire.annee}</span>
          </Card>
        </section>
      )}

      <Card title="Dépenses et recettes nettes">
        <LineChart
          data={data}
          series={SERIES_DEPENSES_RECETTES}
          nomFichierExport="historique-depenses-recettes.png"
        />
      </Card>

      {/* Graphique distinct plutôt qu'une troisième courbe sur le graphique
          ci-dessus : le solde (~-90 à -170 Md€) est un ordre de grandeur plus
          petit que dépenses/recettes (~300-600 Md€) — sur un axe Y commun, sa
          courbe serait écrasée et quasi illisible. */}
      <Card title="Solde budgétaire">
        <LineChart data={data} series={SERIES_SOLDE} nomFichierExport="historique-solde.png" />
      </Card>

      {/* Du général au particulier : les totaux de l'État d'abord, puis une
          dépense choisie. */}
      <Card
        title="Évolution d'une dépense"
        note={
          evolutionMission
            ? `${evolutionMission.premier.annee} → ${evolutionMission.dernier.annee} : ${
                evolutionMission.ratio >= 0 ? '+' : ''
              }${formatPct(evolutionMission.ratio)}`
            : undefined
        }
        actions={
          <label
            htmlFor="mission-historique"
            className="flex items-center gap-2 text-[13px] text-ink-muted"
          >
            <span className="whitespace-nowrap">Mission</span>
            <select
              id="mission-historique"
              value={missionActive}
              onChange={(event) => setMissionChoisie(event.target.value)}
              className="h-8 max-w-[19rem] rounded-md border border-line-strong bg-surface px-2
                text-[13px] font-semibold text-ink"
            >
              {missionsSelectionnables.map((mission) => (
                <option key={mission.slug} value={mission.slug}>
                  {mission.nomOfficiel}
                </option>
              ))}
            </select>
          </label>
        }
        footer={
          serieMission.length > 0
            ? `${nomMissionActive} — ${serieMission.length} exercice${
                serieMission.length > 1 ? 's' : ''
              } de ${serieMission[0].annee} à ${serieMission[serieMission.length - 1].annee}. ` +
              'Crédits de paiement du budget général, périmètre identique à celui des totaux ' +
              'ci-dessus. Une mission absente d’un exercice n’y apparaît pas : la série ' +
              'commence à sa création et s’arrête à sa suppression ou à son renommage.'
            : undefined
        }
      >
        <LineChart
          data={serieMission}
          series={SERIES_MISSION}
          nomFichierExport={`historique-${missionActive || 'mission'}.png`}
        />
      </Card>

      {lignes.length > 0 && (
        <Card
          flush
          title="Détail année par année"
          note={`${lignes.length} exercices`}
          actions={
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              Exporter CSV
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-line px-4 py-2.5 text-left text-[11.5px]
                      font-semibold uppercase tracking-[0.04em] text-ink-faint"
                  >
                    Année
                  </th>
                  {['Dépenses', 'Recettes', 'Solde', 'Évolution du solde'].map((entete) => (
                    <th
                      key={entete}
                      scope="col"
                      className="whitespace-nowrap border-b border-line px-4 py-2.5 text-right
                        text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-faint"
                    >
                      {entete}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne) => (
                  <tr
                    key={ligne.annee}
                    className="border-b border-line last:border-b-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-2.5 font-medium tabular-nums text-ink">{ligne.annee}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-muted">
                      {formatMd(ligne.depenses)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-muted">
                      {formatMd(ligne.recettes)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-muted">
                      {formatMd(ligne.solde)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {ligne.ecartSolde === undefined ? (
                        <span className="text-ink-faint">—</span>
                      ) : (
                        <Badge
                          tone={ligne.ecartSolde >= 0 ? 'pos' : 'neg'}
                          className="tabular-nums"
                        >
                          {formatEcartMd(ligne.ecartSolde)}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';

import LineChart, { type LineChartSerie } from '../components/charts/LineChart';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useHistorique } from '../hooks/useHistorique';
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

  // Écart de dépenses d'une année sur la précédente, pour la colonne
  // d'évolution du tableau (décroissant : l'année la plus récente en tête).
  const lignes = useMemo(
    () =>
      data
        .map((item, index) => ({
          ...item,
          ecartDepenses: index > 0 ? item.depenses - data[index - 1].depenses : undefined,
        }))
        .slice()
        .reverse(),
    [data],
  );

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
                  {['Dépenses', 'Recettes', 'Solde', 'Évolution des dépenses'].map((entete) => (
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
                      {ligne.ecartDepenses === undefined ? (
                        <span className="text-ink-faint">—</span>
                      ) : (
                        <Badge tone="quiet" className="tabular-nums">
                          {formatEcartMd(ligne.ecartDepenses)}
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

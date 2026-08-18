import LineChart, { type LineChartSerie } from '../components/charts/LineChart';
import { Button } from '../components/ui/Button';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useHistorique } from '../hooks/useHistorique';
import { CATEGORICAL_COLORS } from '../utils/couleurCategorielle';
import { exportCsv } from '../utils/exportCsv';

// Mêmes couleurs que l'ancien graphique unique (palette catégorielle
// validée, cf. skill dataviz) : dépenses/recettes gardent leurs deux
// premières teintes, le déficit garde la sienne bien qu'il vive désormais
// dans son propre graphique — la continuité visuelle facilite le repérage
// pour les utilisateurs habitués à l'ancien affichage.
const SERIES_DEPENSES_RECETTES: LineChartSerie[] = [
  { key: 'depenses', label: 'Dépenses nettes', color: CATEGORICAL_COLORS[0] },
  { key: 'recettes', label: 'Recettes nettes', color: CATEGORICAL_COLORS[1] },
];
const SERIES_DEFICIT: LineChartSerie[] = [
  { key: 'deficit', label: 'Déficit', color: CATEGORICAL_COLORS[2] },
];

export default function Historique() {
  const { data: historique } = useHistorique();

  const data = (historique ?? []).map((item) => ({
    annee: item.annee,
    depenses: item.depensesNettes,
    recettes: item.recettesNettes,
    deficit: item.deficit,
  }));

  const handleExportCsv = () => {
    exportCsv(data, 'historique-depenses-recettes-deficit.csv', [
      { cle: 'annee', libelle: 'Année' },
      { cle: 'depenses', libelle: 'Dépenses nettes (€)' },
      { cle: 'recettes', libelle: 'Recettes nettes (€)' },
      { cle: 'deficit', libelle: 'Déficit (€)' },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Historique</h1>
        {data.length > 0 && (
          <Button type="button" variant="secondary" onClick={handleExportCsv}>
            Exporter CSV
          </Button>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Dépenses et recettes nettes
        </h2>
        <LineChart
          data={data}
          series={SERIES_DEPENSES_RECETTES}
          nomFichierExport="historique-depenses-recettes.png"
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <GlossaryTerm term="déficit">Déficit</GlossaryTerm>
        </h2>
        {/* Graphique distinct plutôt qu'une troisième courbe sur le graphique
            ci-dessus : le déficit (~90-150 Md€) est un ordre de grandeur
            plus petit que dépenses/recettes (~300-600 Md€) — sur un axe Y
            commun, sa courbe serait écrasée en bas du graphique et quasi
            illisible. Une échelle dédiée le rend enfin lisible. */}
        <LineChart data={data} series={SERIES_DEFICIT} nomFichierExport="historique-deficit.png" />
      </div>
    </div>
  );
}

import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useIndicateur } from '../hooks/useIndicateur';

interface SourceDonnee {
  nom: string;
  url: string;
}

const sourcesStatiques: SourceDonnee[] = [
  { nom: 'data.gouv.fr', url: 'https://www.data.gouv.fr/' },
  { nom: 'performance-publique.budget.gouv.fr', url: 'https://www.performance-publique.budget.gouv.fr/' },
  { nom: 'Direction du budget (budget.gouv.fr)', url: 'https://www.budget.gouv.fr/' },
  { nom: "Documents budgétaires de l'Assemblée nationale", url: 'https://www.assemblee-nationale.fr/' },
];

export default function Donnees() {
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;

  const { data: budget } = useBudgetAnnee(derniereAnnee);
  const { data: indicateur } = useIndicateur(derniereAnnee);

  const sourcesDynamiques: SourceDonnee[] = [];
  if (budget?.sourceUrl) {
    sourcesDynamiques.push({ nom: `Dépenses et recettes ${budget.annee}`, url: budget.sourceUrl });
  }
  if (indicateur?.sourcePibUrl) {
    sourcesDynamiques.push({ nom: `PIB ${indicateur.annee}`, url: indicateur.sourcePibUrl });
  }
  if (indicateur?.sourcePopulationUrl) {
    sourcesDynamiques.push({ nom: `Population ${indicateur.annee}`, url: indicateur.sourcePopulationUrl });
  }

  const urlsConnues = new Set(sourcesStatiques.map((source) => source.url));
  const sources = [
    ...sourcesStatiques,
    ...sourcesDynamiques.filter((source) => !urlsConnues.has(source.url)),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Données</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Les données présentées sur BudgetCitoyen.fr proviennent de sources publiques officielles.
      </p>

      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-800 hover:underline dark:text-blue-300"
            >
              {source.nom}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Card } from '../components/ui/Card';
import { ExternalLinkIcon } from '../components/ui/icons';
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Données &amp; sources</h1>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          Toutes les données présentées sur BudgetCitoyen.fr proviennent de sources publiques
          officielles, réutilisables sous Licence Ouverte 2.0.
        </p>
      </div>

      <Card flush title="Sources officielles" note={`${sources.length} sources`}>
        <ul>
          {sources.map((source) => (
            <li key={source.url} className="border-b border-line last:border-b-0">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-ink
                  transition-colors hover:bg-surface-hover hover:text-accent"
              >
                {source.nom}
                <ExternalLinkIcon className="h-3.5 w-3.5 flex-none text-ink-faint" />
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

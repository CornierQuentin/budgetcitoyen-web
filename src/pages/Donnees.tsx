import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { DocumentIcon, ExternalLinkIcon, ShieldIcon } from '../components/ui/icons';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useIndicateur } from '../hooks/useIndicateur';
import { urlDocumentationApi } from '../utils/urlsApi';

interface SourceDonnee {
  nom: string;
  url: string;
  /** Ce que cette source alimente concrètement sur le site. */
  alimente?: string;
  /** Cadence de publication à la source. */
  cadence?: string;
  /** Période réellement couverte par les données ingérées. */
  couverture?: string;
}

const sourcesStatiques: SourceDonnee[] = [
  {
    nom: 'data.gouv.fr',
    url: 'https://www.data.gouv.fr/',
    alimente: 'Marchés publics (DECP)',
    cadence: 'Quotidienne',
    couverture: '2010 → aujourd’hui',
  },
  {
    nom: 'performance-publique.budget.gouv.fr',
    url: 'https://www.performance-publique.budget.gouv.fr/',
    alimente: 'Missions, programmes et actions',
    cadence: 'Annuelle',
    couverture: '2006 → 2026',
  },
  {
    nom: 'Direction du budget (budget.gouv.fr)',
    url: 'https://www.budget.gouv.fr/',
    alimente: 'Documentation budgétaire',
    cadence: 'Annuelle',
  },
  {
    nom: "Documents budgétaires de l'Assemblée nationale",
    url: 'https://www.assemblee-nationale.fr/',
    alimente: 'Niches fiscales (annexe « Voies et moyens »)',
    cadence: 'Annuelle',
    couverture: 'millésime 2021',
  },
];

export default function Donnees() {
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;

  const { data: budget } = useBudgetAnnee(derniereAnnee);
  const { data: indicateur } = useIndicateur(derniereAnnee);

  const sourcesDynamiques: SourceDonnee[] = [];
  if (budget?.sourceUrl) {
    sourcesDynamiques.push({
      nom: `Loi de finances ${budget.annee} — Légifrance`,
      url: budget.sourceUrl,
      alimente: 'Dépenses, recettes et solde',
      cadence: 'Annuelle',
      couverture: `exercice ${budget.annee}`,
    });
  }
  if (indicateur?.sourcePibUrl) {
    sourcesDynamiques.push({
      nom: `PIB ${indicateur.annee} — INSEE`,
      url: indicateur.sourcePibUrl,
      alimente: 'Ratios rapportés au PIB',
      cadence: 'Annuelle',
      couverture: `${indicateur.annee}`,
    });
  }
  if (indicateur?.sourcePopulationUrl) {
    sourcesDynamiques.push({
      nom: `Population ${indicateur.annee} — INSEE`,
      url: indicateur.sourcePopulationUrl,
      alimente: 'Montants par habitant',
      cadence: 'Annuelle',
      couverture: `${indicateur.annee}`,
    });
  }

  const urlsConnues = new Set(sourcesStatiques.map((source) => source.url));
  const sources = [
    ...sourcesStatiques,
    ...sourcesDynamiques.filter((source) => !urlsConnues.has(source.url)),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Données &amp; sources</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Toutes les données présentées sur BudgetCitoyen.fr proviennent de sources publiques
            officielles, réutilisables sous Licence Ouverte 2.0.
          </p>
        </div>

        {/* Les mêmes données sont exposées par une API REST publique et
            documentée (CDC §6.1) : c'est la porte d'entrée des développeurs,
            le quatrième public du projet. */}
        <a
          href={urlDocumentationApi()}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-accent
            bg-accent px-3 text-[13px] font-semibold text-accent-contrast transition-colors
            hover:border-accent-hover hover:bg-accent-hover"
        >
          Documentation de l&apos;API
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>

      <Card flush title="Sources officielles" note={`${sources.length} sources`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr>
                {['Source', 'Alimente', 'Couverture', 'Mise à jour'].map((entete) => (
                  <th
                    key={entete}
                    scope="col"
                    className="whitespace-nowrap border-b border-line px-4 py-2.5 text-left
                      text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-faint"
                  >
                    {entete}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.url}
                  className="border-b border-line last:border-b-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-2.5">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-ink
                        hover:text-accent hover:underline hover:underline-offset-2"
                    >
                      {source.nom}
                      <ExternalLinkIcon className="h-3.5 w-3.5 flex-none text-ink-faint" />
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{source.alimente ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-ink-muted">
                    {source.couverture ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {source.cadence ? (
                      <Badge tone={source.cadence === 'Quotidienne' ? 'accent' : 'quiet'}>
                        {source.cadence}
                      </Badge>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-3 text-xs text-ink-muted">
          Chaque chiffre du site porte une icône renvoyant au document précis qui l&apos;établit,
          pas seulement au portail. Données réutilisables sous Licence Ouverte 2.0.
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md
              bg-accent-soft text-accent"
          >
            <DocumentIcon className="h-[17px] w-[17px]" />
          </span>
          <div>
            <h2 className="text-[13.5px] font-bold text-ink">Réutiliser les données</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Toutes les vues s&apos;exportent en CSV, tous les graphiques en PNG, et chaque page
              produit une URL partageable qui restitue vos filtres. Une API REST publique et
              documentée expose les mêmes données.
            </p>
          </div>
        </Card>

        {/* Dire ce que le site ne fait pas vaut engagement : c'est la
            contrepartie de la neutralité politique et du refus d'estimer une
            donnée manquante (cf. PRODUCT.md). */}
        <Card className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md
              bg-surface-sunken text-ink-muted"
          >
            <ShieldIcon className="h-[17px] w-[17px]" />
          </span>
          <div>
            <h2 className="text-[13.5px] font-bold text-ink">Ce que le site ne fait pas</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">
              Aucun commentaire partisan, aucune donnée inventée pour combler un trou. Quand une
              donnée manque — la population de l&apos;année en cours, le nom d&apos;un titulaire de
              marché — la page le dit au lieu de l&apos;estimer.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}

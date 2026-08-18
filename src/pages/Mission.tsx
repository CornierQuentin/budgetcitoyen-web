import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissionDetail } from '../hooks/useMissionDetail';
import { useMissionHistorique } from '../hooks/useMissionHistorique';
import { formatEuros, formatMd } from '../utils/format';

export default function Mission() {
  const { slug } = useParams<{ slug: string }>();

  // Cette page se monte dans l'<Outlet /> du Dashboard, tout en bas de la
  // page (sous les deux camemberts) : sans défilement automatique, rien ne
  // laisse deviner qu'un clic sur une mission (tranche du camembert ou ligne
  // du détail complet) a bien affiché quelque chose — retour utilisateur.
  const conteneurRef = useRef<HTMLElement>(null);
  const { data: detail, isLoading, isError } = useMissionDetail(slug);

  // Dépend aussi de `isLoading` : au premier rendu (état de chargement), la
  // section est très courte et le défilement calculé à ce moment-là n'amène
  // pas la vraie hauteur finale à l'écran. Une fois les données arrivées
  // (isLoading passe à false, `slug` inchangé), l'effet se redéclenche et
  // défile vers le contenu complet, désormais dans sa hauteur définitive.
  // `behavior: 'auto'` (saut instantané) plutôt que 'smooth' : ce dernier
  // dépend de l'animation par compositing du navigateur (rAF), qui peut être
  // throttled ou simplement ignorée selon le contexte (onglet en arrière-plan,
  // prefers-reduced-motion) — un saut instantané est fiable dans tous les cas
  // et répond au besoin exprimé (voir qu'un clic a bien affiché du contenu).
  useEffect(() => {
    conteneurRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [slug, isLoading]);
  const { data: historique } = useMissionHistorique(slug);
  // Ne garde que les années où le libellé change réellement par rapport à
  // l'année précédente : sur ~7 ans, la plupart des missions gardent le même
  // nom, lister chaque année serait redondant (retour utilisateur).
  const changementsLibelle = (historique ?? [])
    .slice()
    .sort((a, b) => a.annee - b.annee)
    .reduce<NonNullable<typeof historique>>((acc, item) => {
      if (acc.length === 0 || acc[acc.length - 1].nomOfficiel !== item.nomOfficiel) {
        acc.push(item);
      }
      return acc;
    }, []);
  // GET /missions/{slug}/detail n'expose pas de sourceUrl propre à la
  // mission : on relie donc le chiffre total au budget de l'année, qui est
  // la source officielle des mêmes données (répartition par mission).
  const { data: budgetAnnee } = useBudgetAnnee(detail?.annee);

  if (isLoading) {
    return (
      <section ref={conteneurRef} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de la mission…</p>
      </section>
    );
  }

  if (isError || !detail) {
    return (
      <section ref={conteneurRef} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mission introuvable pour « {slug} ».
        </p>
      </section>
    );
  }

  return (
    <section ref={conteneurRef} className="space-y-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {detail.nomOfficiel}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Année {detail.annee} — {formatMd(detail.montantTotal)} au total
          {budgetAnnee && (
            <SourceIcon url={budgetAnnee.sourceUrl} label={`mission ${detail.nomOfficiel}`} />
          )}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          <GlossaryTerm term="Programme">Programmes</GlossaryTerm>
        </h3>
        {detail.programmes
          .slice()
          .sort((a, b) => b.montantTotal - a.montantTotal)
          .map((programme) => (
            <div
              key={programme.id}
              className="rounded-md border border-gray-100 p-3 dark:border-gray-800"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {programme.code} — {programme.nom}
                </p>
                <p className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {formatMd(programme.montantTotal)}
                </p>
              </div>

              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-xs dark:divide-gray-800">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-400"
                      >
                        <GlossaryTerm term="Action">Action</GlossaryTerm>
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-right font-medium text-gray-500 dark:text-gray-400"
                      >
                        <GlossaryTerm term="AE">AE</GlossaryTerm>
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-right font-medium text-gray-500 dark:text-gray-400"
                      >
                        <GlossaryTerm term="CP">CP</GlossaryTerm>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {programme.actions
                      .slice()
                      .sort((a, b) => b.cp - a.cp)
                      .map((action) => (
                        <tr key={action.id}>
                          <td className="px-2 py-1 text-gray-700 dark:text-gray-300">
                            {action.code} — {action.nom}
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-300">
                            {formatEuros(action.ae)}
                          </td>
                          <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-300">
                            {formatEuros(action.cp)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </div>

      {changementsLibelle.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Libellé au fil du temps
          </h3>
          <ul className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
            {changementsLibelle.map((item) => (
              <li key={item.annee}>
                {item.annee} : {item.nomOfficiel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

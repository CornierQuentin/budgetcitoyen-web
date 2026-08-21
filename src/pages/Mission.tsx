import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissionDetail } from '../hooks/useMissionDetail';
import { useMissionHistorique } from '../hooks/useMissionHistorique';
import { formatEuros, formatMd } from '../utils/format';
import { parseIntSearchParam } from '../utils/searchParams';

export default function Mission() {
  const { slug } = useParams<{ slug: string }>();

  // Cette page se monte dans l'<Outlet /> du Dashboard, tout en bas de la
  // page (sous les deux camemberts) : sans défilement automatique, rien ne
  // laisse deviner qu'un clic sur une mission (tranche du camembert ou ligne
  // du détail complet) a bien affiché quelque chose — retour utilisateur.
  const conteneurRef = useRef<HTMLElement>(null);

  // Cette page vit dans l'<Outlet /> du tableau de bord, qui porte l'année
  // active dans l'URL (`?annee=`) et la conserve en naviguant ici. Sans la
  // lire, la page affichait toujours la dernière année disponible : arriver
  // depuis un tableau de bord réglé sur 2023 montrait les chiffres 2026.
  const [searchParams] = useSearchParams();
  const annee = parseIntSearchParam(searchParams.get('annee'));

  const { data: detail, isLoading, isError } = useMissionDetail(slug, annee);

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
  // Vrai dès qu'au moins un programme porte un vrai détail par action. La
  // limite étant celle de la SOURCE de l'année, elle vaut en pratique pour
  // toute la mission ; on ne le suppose pas pour autant.
  const detailParActionDisponible = (detail?.programmes ?? []).some(
    (programme) => programme.actionsDetaillees,
  );

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
      <section ref={conteneurRef} className="rounded-lg border border-line p-4 ">
        <p className="text-sm text-ink-muted">Chargement de la mission…</p>
      </section>
    );
  }

  if (isError || !detail) {
    return (
      <section ref={conteneurRef} className="rounded-lg border border-line p-4 ">
        <p className="text-sm text-ink-muted">
          Mission introuvable pour « {slug} ». Le lien est peut-être obsolète ou mal orthographié.
        </p>
        <Link
          to="/tableau-de-bord"
          className="mt-2 inline-block text-sm font-medium text-accent hover:underline
            "
        >
          ← Retour au tableau de bord
        </Link>
      </section>
    );
  }

  return (
    <section ref={conteneurRef} className="space-y-6 rounded-lg border border-line p-4 ">
      <div>
        <h2 className="text-xl font-semibold text-ink">{detail.nomOfficiel}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Année {detail.annee} — {formatMd(detail.montantTotal)} au total
          {budgetAnnee && (
            <SourceIcon url={budgetAnnee.sourceUrl} label={`mission ${detail.nomOfficiel}`} />
          )}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-ink-muted">
          <GlossaryTerm term="Programme">Programmes</GlossaryTerm>
        </h3>

        {/* Dit une seule fois, au niveau de la mission, pourquoi le détail
            s'arrête là — plutôt que répété sous chacun des programmes. Ce
            n'est pas une lacune du site : c'est le niveau de détail que
            publie le texte de loi lui-même pour cette année. */}
        {!detailParActionDisponible && (
          <p className="rounded-md border border-line bg-surface-sunken p-3 text-[13px] text-ink-muted">
            Pour {detail.annee}, la loi de finances publiée au Journal officiel — le texte lié
            ci-dessus — s&apos;arrête au programme : elle ne donne ni les numéros de programme ni la
            répartition par action. Le site n&apos;affiche donc que ce que la source contient.
          </p>
        )}

        {detail.programmes
          .slice()
          .sort((a, b) => b.montantTotal - a.montantTotal)
          .map((programme) => (
            <div key={programme.id} className="rounded-md border border-line p-3 ">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-ink">
                  {/* Le code n'est affiché que lorsqu'il vient de la source :
                      autrement c'est une clé interne, qui n'apprendrait rien
                      et se lirait comme une référence officielle. */}
                  {programme.codeOfficiel ? `${programme.code} — ${programme.nom}` : programme.nom}
                </p>
                <p className="whitespace-nowrap text-sm text-ink-muted">
                  {formatMd(programme.montantTotal)}
                </p>
              </div>

              {programme.actionsDetaillees && (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full divide-y divide-line text-xs ">
                    <thead>
                      <tr>
                        <th scope="col" className="px-2 py-1 text-left font-medium text-ink-muted">
                          <GlossaryTerm term="Action">Action</GlossaryTerm>
                        </th>
                        <th scope="col" className="px-2 py-1 text-right font-medium text-ink-muted">
                          <GlossaryTerm term="AE">AE</GlossaryTerm>
                        </th>
                        <th scope="col" className="px-2 py-1 text-right font-medium text-ink-muted">
                          <GlossaryTerm term="CP">CP</GlossaryTerm>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {programme.actions
                        .slice()
                        .sort((a, b) => b.cp - a.cp)
                        .map((action) => (
                          <tr key={action.id}>
                            <td className="px-2 py-1 text-ink-muted">
                              {action.code} — {action.nom}
                            </td>
                            <td className="px-2 py-1 text-right text-ink-muted">
                              {formatEuros(action.ae)}
                            </td>
                            <td className="px-2 py-1 text-right text-ink-muted">
                              {formatEuros(action.cp)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
      </div>

      {changementsLibelle.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-ink-muted">Libellé au fil du temps</h3>
          <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
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

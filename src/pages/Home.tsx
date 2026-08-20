import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, useReducedMotion } from 'framer-motion';

import { SourceIcon } from '../components/ui/SourceIcon';
import { CodeIcon, LinkIcon, ListIcon, ShieldIcon } from '../components/ui/icons';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useComparateur } from '../hooks/useComparateur';
import { useHistorique } from '../hooks/useHistorique';
import { useMarches } from '../hooks/useMarches';
import { useMissions } from '../hooks/useMissions';
import { formatEuros, formatMd, soldeDepuisDeficit } from '../utils/format';

// `formatEuros` arrondit à l'euro entier : il transformerait le ratio 1,29 en
// « 1 € », c'est-à-dire en contresens (« l'État dépense 1 € pour chaque euro
// encaissé »). Ce ratio a donc son propre formateur, à deux décimales.
const ratioFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface AnimatedValueProps {
  value: number;
  format: (value: number) => string;
}

// Compteur animé (CDC 6.2 : « animations compteurs sur les chiffres clés »),
// désactivé sous prefers-reduced-motion.
function AnimatedValue({ value, format }: AnimatedValueProps) {
  const [display, setDisplay] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(0, value, { duration: 1.2, ease: 'easeOut', onUpdate: setDisplay });
    return () => controls.stop();
  }, [value, prefersReducedMotion]);

  return <>{format(display)}</>;
}

/** Section pleine largeur, avec sa gouttière et son ancre. */
function Section({
  id,
  children,
  bande = false,
}: {
  id?: string;
  children: ReactNode;
  bande?: boolean;
}) {
  return (
    <section
      id={id}
      // `scroll-mt` : sans lui, l'en-tête collant recouvre le titre visé par
      // l'ancre.
      className={`scroll-mt-20 py-14 sm:py-20 ${bande ? 'border-y border-line bg-ground' : ''}`}
    >
      <div className="mx-auto w-full max-w-[1120px] px-6">{children}</div>
    </section>
  );
}

function TitreSection({ titre, chapeau }: { titre: string; chapeau: ReactNode }) {
  return (
    <>
      <h2 className="max-w-[22ch] text-balance text-[clamp(26px,3vw,36px)] font-bold leading-[1.12] tracking-[-0.028em] text-ink">
        {titre}
      </h2>
      <p className="mt-3.5 max-w-[62ch] text-[16.5px] text-ink-muted">{chapeau}</p>
    </>
  );
}

/** Une ligne « mission » du visuel produit : nom, barre de part, montant. */
function LigneMission({
  nom,
  part,
  montant,
}: {
  nom: string;
  part: number;
  montant: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line py-1.5 text-[11.5px] last:border-b-0">
      <span className="min-w-0 flex-1 truncate text-ink">{nom}</span>
      <span
        aria-hidden="true"
        className="h-[5px] w-[76px] flex-none overflow-hidden rounded-sm bg-bar-track"
      >
        <span className="block h-full rounded-sm bg-bar" style={{ width: `${part}%` }} />
      </span>
      <span className="w-[64px] flex-none text-right tabular-nums text-ink-muted">{montant}</span>
    </div>
  );
}

/** Bloc « fonction » : texte d'un côté, aperçu réel de l'autre. */
function BlocFonction({
  titre,
  texte,
  lien,
  libelleLien,
  visuel,
  inverse = false,
}: {
  titre: string;
  texte: ReactNode;
  lien: string;
  libelleLien: string;
  visuel: ReactNode;
  inverse?: boolean;
}) {
  return (
    <div className="mt-12 grid items-center gap-11 lg:grid-cols-2">
      <div className={inverse ? 'lg:order-2' : undefined}>
        <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{titre}</h3>
        <p className="mt-2.5 text-[15.5px] text-ink-muted">{texte}</p>
        <Link
          to={lien}
          className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-accent
            hover:underline hover:underline-offset-4"
        >
          {libelleLien} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className={inverse ? 'lg:order-1' : undefined}>{visuel}</div>
    </div>
  );
}

function CadreVisuel({ titre, note, children }: { titre: string; note?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5 shadow-sm">
      <div className="mb-2.5 flex items-center gap-2 border-b border-line pb-2 text-xs font-semibold text-ink">
        {titre}
        {note && <span className="ml-auto text-[11px] font-normal text-ink-faint">{note}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;
  const anneePrecedente = derniereAnnee !== undefined ? derniereAnnee - 1 : undefined;

  const { data: budget } = useBudgetAnnee(derniereAnnee);
  const { data: budgetPrecedent } = useBudgetAnnee(anneePrecedente);
  const { data: missions } = useMissions(derniereAnnee);
  const { data: historique } = useHistorique();
  const { data: comparaison } = useComparateur(anneePrecedente, derniereAnnee);
  // Une seule page de 3 marchés : donne le total ET des lignes réelles à
  // montrer, sans charger de volumétrie inutile sur la page d'accueil.
  const { data: marches } = useMarches({ page: 1, pageSize: 3 });

  const missionsTriees = useMemo(
    () => (missions ?? []).slice().sort((a, b) => b.montantTotal - a.montantTotal),
    [missions],
  );
  const missionMax = missionsTriees[0]?.montantTotal ?? 0;

  const pireSolde = useMemo(() => {
    if (!historique || historique.length === 0) return undefined;
    return historique.reduce((pire, item) => (item.deficit > pire.deficit ? item : pire));
  }, [historique]);
  const premiereAnneeHistorique = useMemo(
    () =>
      historique && historique.length > 0
        ? Math.min(...historique.map((item) => item.annee))
        : undefined,
    [historique],
  );

  const hausses = useMemo(
    () =>
      (comparaison?.missions ?? [])
        .slice()
        .sort((a, b) => b.deltaAbsolu - a.deltaAbsolu)
        .filter((mission) => mission.deltaAbsolu > 0)
        .slice(0, 3),
    [comparaison],
  );
  const baisses = useMemo(
    () =>
      (comparaison?.missions ?? [])
        .slice()
        .sort((a, b) => a.deltaAbsolu - b.deltaAbsolu)
        .filter((mission) => mission.deltaAbsolu < 0)
        .slice(0, 2),
    [comparaison],
  );

  // Exemple du simulateur : une seule ligne est déplacée, et l'écart affiché
  // est exactement celui-là. Un exemple qui ne tomberait pas juste
  // arithmétiquement décrédibiliserait la promesse de rigueur du site.
  const missionSimulee = missionsTriees.find((mission) => mission.slug === 'defense')
    ?? missionsTriees[2];
  const baisseSimulee = missionSimulee ? missionSimulee.montantTotal * 0.12 : 0;
  const soldeSimule =
    budget !== undefined ? soldeDepuisDeficit(budget.deficit) + baisseSimulee : undefined;

  const ratioDepensePourUnEuro =
    budget && budget.recettesNettes > 0 ? budget.depensesNettes / budget.recettesNettes : undefined;

  return (
    <>
      {/* ─────────── Ouverture ─────────── */}
      <div className="mx-auto w-full max-w-[1120px] px-6 pb-5 pt-16 text-center sm:pt-20">
        <h1 className="mx-auto max-w-[17ch] text-balance text-[clamp(38px,5.4vw,64px)] font-bold leading-[1.04] tracking-[-0.035em] text-ink">
          Le budget de l&apos;État, enfin lisible
        </h1>
        <p className="mx-auto mt-5 max-w-[60ch] text-balance text-[clamp(17px,1.5vw,19.5px)] leading-[1.5] text-ink-muted">
          {budget ? formatMd(budget.depensesNettes) : '—'} de dépenses,{' '}
          {missionsTriees.length > 0 ? `${missionsTriees.length} missions` : 'des dizaines de missions'},{' '}
          {marches ? marches.total.toLocaleString('fr-FR') : '—'} marchés publics. Tout est public —
          mais éparpillé dans des fichiers que personne ne lit. BudgetCitoyen le rend explorable,
          chiffre par chiffre, source à l&apos;appui.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/tableau-de-bord"
            className="inline-flex h-10 items-center rounded-md border border-accent bg-accent px-5
              text-[14.5px] font-semibold text-accent-contrast transition-colors
              hover:border-accent-hover hover:bg-accent-hover"
          >
            Explorer le budget {derniereAnnee ?? ''}
          </Link>
          <Link
            to="/mon-budget"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface
              px-5 text-[14.5px] font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            Calculer ma contribution
          </Link>
        </div>
        <p className="mt-4 text-[13.5px] text-ink-faint">
          Gratuit, sans compte, open source. Données officielles sous Licence Ouverte 2.0.
        </p>
      </div>

      {/* ─────────── Le produit, montré ─────────── */}
      <div className="mx-auto w-full max-w-[1120px] px-6">
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-md">
          <div className="flex items-center gap-2 border-b border-line bg-surface-sunken px-3.5 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="ml-2.5 text-xs tabular-nums text-ink-faint">
              budgetcitoyen.fr/tableau-de-bord
            </span>
          </div>
          <div className="p-4">
            <div className="mb-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { label: 'Dépenses totales', valeur: budget?.depensesNettes },
                { label: 'Recettes totales', valeur: budget?.recettesNettes },
                {
                  label: 'Solde budgétaire',
                  valeur: budget ? soldeDepuisDeficit(budget.deficit) : undefined,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-line p-2.5">
                  <span className="block text-[10.5px] text-ink-muted">{item.label}</span>
                  <span className="mt-0.5 block text-[19px] font-bold tracking-[-0.025em] tabular-nums text-ink">
                    {item.valeur !== undefined ? formatMd(item.valeur) : '—'}
                  </span>
                </div>
              ))}
            </div>
            {missionsTriees.slice(0, 6).map((mission) => (
              <LigneMission
                key={mission.slug}
                nom={mission.nomOfficiel}
                part={missionMax > 0 ? (mission.montantTotal / missionMax) * 100 : 0}
                montant={formatMd(mission.montantTotal)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─────────── Trois chiffres commentés ─────────── */}
      <Section id="chiffres">
        <TitreSection
          titre={`Trois chiffres pour situer l'exercice ${derniereAnnee ?? ''}`}
          chapeau="Chacun renvoie au texte officiel qui l'établit. Vous n'avez jamais à nous croire sur parole."
        />

        <div className="mt-11 grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-[clamp(32px,3.6vw,44px)] font-bold leading-none tracking-[-0.032em] tabular-nums text-ink">
              {budget ? <AnimatedValue value={budget.depensesNettes} format={formatMd} /> : '—'}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              Ce que l&apos;État prévoit de dépenser
              {budget && <SourceIcon url={budget.sourceUrl} label={`dépenses ${derniereAnnee}`} />}
            </div>
            <p className="mt-1.5 text-[14.5px] leading-[1.5] text-ink-muted">
              Réparties entre {missionsTriees.length || '—'} missions. La plus lourde n&apos;est pas
              celle qu&apos;on croit :{' '}
              {missionsTriees[0]
                ? `${missionsTriees[0].nomOfficiel.toLowerCase()}, à elle seule, pèse ${formatMd(missionsTriees[0].montantTotal)}`
                : 'le détail est dans le tableau de bord'}
              .
            </p>
          </div>

          <div>
            <div className="text-[clamp(32px,3.6vw,44px)] font-bold leading-none tracking-[-0.032em] tabular-nums text-ink">
              {budget ? <AnimatedValue value={budget.recettesNettes} format={formatMd} /> : '—'}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              Ce qu&apos;il prévoit d&apos;encaisser
              {budget && <SourceIcon url={budget.sourceUrl} label={`recettes ${derniereAnnee}`} />}
            </div>
            <p className="mt-1.5 text-[14.5px] leading-[1.5] text-ink-muted">
              TVA, impôt sur le revenu, impôt sur les sociétés, taxes sur l&apos;énergie et le reste.
              {budget && budgetPrecedent && (
                <>
                  {' '}
                  C&apos;est {formatMd(
                    Math.abs(budget.recettesNettes - budgetPrecedent.recettesNettes),
                  )}{' '}
                  {budget.recettesNettes >= budgetPrecedent.recettesNettes ? 'de plus' : 'de moins'}{' '}
                  qu&apos;en {anneePrecedente}.
                </>
              )}
            </p>
          </div>

          <div>
            <div className="text-[clamp(32px,3.6vw,44px)] font-bold leading-none tracking-[-0.032em] tabular-nums text-ink">
              {budget ? (
                <AnimatedValue value={soldeDepuisDeficit(budget.deficit)} format={formatMd} />
              ) : (
                '—'
              )}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              La différence, appelée solde budgétaire
              {budget && <SourceIcon url={budget.sourceUrl} label={`solde ${derniereAnnee}`} />}
            </div>
            <p className="mt-1.5 text-[14.5px] leading-[1.5] text-ink-muted">
              {ratioDepensePourUnEuro !== undefined && (
                <>
                  Autrement dit : l&apos;État dépense{' '}
                  {ratioFormatter.format(ratioDepensePourUnEuro)} pour chaque euro qu&apos;il
                  encaisse.{' '}
                </>
              )}
              {pireSolde && premiereAnneeHistorique !== undefined && (
                <>
                  Le solde le plus bas depuis {premiereAnneeHistorique} a été atteint en{' '}
                  {pireSolde.annee}, à {formatMd(soldeDepuisDeficit(pireSolde.deficit))}.
                </>
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* ─────────── Ce que vous pouvez faire ─────────── */}
      <Section id="outil" bande>
        <TitreSection
          titre="Ce que vous pouvez faire ici"
          chapeau="Quatre façons d'entrer dans le budget, du regard d'ensemble à la ligne de marché public."
        />

        <BlocFonction
          titre="Voir où va l'argent"
          texte={`Les ${missionsTriees.length || ''} missions de l'État, classées par montant, jusqu'au programme et à l'action. Chaque ligne est cliquable, chaque total est sourcé, et tout s'exporte en CSV.`}
          lien="/tableau-de-bord"
          libelleLien="Ouvrir le tableau de bord"
          visuel={
            <CadreVisuel
              titre="Dépenses par mission"
              note={
                budget
                  ? `${missionsTriees.length} missions · ${formatMd(budget.depensesNettes)}`
                  : undefined
              }
            >
              {missionsTriees.slice(0, 5).map((mission) => (
                <LigneMission
                  key={mission.slug}
                  nom={mission.nomOfficiel}
                  part={missionMax > 0 ? (mission.montantTotal / missionMax) * 100 : 0}
                  montant={formatMd(mission.montantTotal)}
                />
              ))}
            </CadreVisuel>
          }
        />

        <BlocFonction
          inverse
          titre="Comparer deux exercices"
          texte="Ce qui a augmenté, ce qui a baissé, et de combien. La page repère aussi les missions qui disparaissent ou apparaissent — souvent un simple renommage qu'on prendrait à tort pour une coupe de crédits."
          lien="/comparer"
          libelleLien="Ouvrir le comparateur"
          visuel={
            <CadreVisuel
              titre={`${anneePrecedente ?? ''} vs ${derniereAnnee ?? ''}`}
              note="plus forts mouvements"
            >
              {[...hausses, ...baisses].map((mission) => (
                <div
                  key={mission.slug}
                  className="flex items-center gap-2.5 border-b border-line py-1.5 text-xs last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-ink">{mission.nom}</span>
                  <span
                    className={`whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[11px]
                      font-semibold tabular-nums ${
                        mission.deltaAbsolu >= 0
                          ? 'border-neg/25 bg-neg-soft text-neg'
                          : 'border-pos/25 bg-pos-soft text-pos'
                      }`}
                  >
                    {mission.deltaAbsolu >= 0 ? '+' : ''}
                    {formatMd(mission.deltaAbsolu)}
                  </span>
                </div>
              ))}
            </CadreVisuel>
          }
        />

        <BlocFonction
          titre="Refaire le budget vous-même"
          texte="Déplacez les curseurs et voyez l'effet immédiat sur le solde. Le calcul est purement arithmétique : aucun effet économique n'est modélisé, aucune politique n'est suggérée."
          lien="/simulateur"
          libelleLien="Ouvrir le simulateur"
          visuel={
            <CadreVisuel
              titre="Solde simulé"
              note={soldeSimule !== undefined ? formatMd(soldeSimule) : undefined}
            >
              {missionsTriees.slice(0, 4).map((mission) => {
                const estSimulee = mission.slug === missionSimulee?.slug;
                const position = estSimulee ? 44 : 50;
                const montant = estSimulee
                  ? mission.montantTotal - baisseSimulee
                  : mission.montantTotal;
                return (
                  <div key={mission.slug} className="flex items-center gap-2.5 py-1.5 text-xs">
                    <span className="w-[104px] flex-none truncate text-ink-muted">
                      {mission.nomOfficiel}
                    </span>
                    <span
                      aria-hidden="true"
                      className="relative h-1 flex-1 rounded-sm bg-bar-track"
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-sm bg-bar"
                        style={{ width: `${position}%` }}
                      />
                      <span
                        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2
                          rounded-full bg-accent"
                        style={{ left: `${position}%` }}
                      />
                    </span>
                    <span className="w-[74px] flex-none whitespace-nowrap text-right tabular-nums text-ink-muted">
                      {formatMd(montant)}
                    </span>
                  </div>
                );
              })}
              {baisseSimulee > 0 && (
                <p className="mt-2.5 text-[11.5px] font-semibold tabular-nums text-pos">
                  +{formatMd(baisseSimulee)} vs budget réel
                </p>
              )}
            </CadreVisuel>
          }
        />

        <BlocFonction
          inverse
          titre="Fouiller les marchés publics"
          texte={`${marches ? marches.total.toLocaleString('fr-FR') : ''} contrats passés par l'État et les collectivités, cherchables par objet, par date et par montant. La source ne fournit que des SIRET, jamais de noms d'entreprises — la page le dit plutôt que de le masquer.`}
          lien="/marches-publics"
          libelleLien="Ouvrir la recherche"
          visuel={
            <CadreVisuel
              titre="Marchés publics"
              note={marches ? `${marches.total.toLocaleString('fr-FR')} résultats` : undefined}
            >
              {(marches?.items ?? []).map((marche) => (
                <div
                  key={marche.id}
                  className="flex items-center gap-2.5 border-b border-line py-1.5 text-xs last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-ink">{marche.objet}</span>
                  <span
                    className="whitespace-nowrap rounded-full border border-line bg-surface-sunken
                      px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-ink-muted"
                  >
                    {formatEuros(marche.montant)}
                  </span>
                </div>
              ))}
            </CadreVisuel>
          }
        />
      </Section>

      {/* ─────────── Pourquoi cet outil existe ─────────── */}
      <Section id="idee">
        <TitreSection
          titre="Pourquoi cet outil existe"
          chapeau={
            <>
              Le budget de l&apos;État est public depuis toujours. Il est aussi, dans les faits,
              illisible : des annexes de plusieurs centaines de pages, des fichiers tabulaires sans
              mode d&apos;emploi, un vocabulaire qui suppose qu&apos;on le maîtrise déjà. Le citoyen
              ordinaire n&apos;a pas d&apos;outil à son niveau. C&apos;est ce trou-là que
              BudgetCitoyen comble — et il le comble sous quatre contraintes qui ne se négocient pas.
            </>
          }
        />

        <div className="mt-11 grid gap-6 md:grid-cols-2">
          {[
            {
              Icone: ShieldIcon,
              titre: 'Neutralité politique absolue',
              texte:
                "Des données factuelles, zéro commentaire partisan. La contrainte va jusqu'au design : aucun montant n'est teinté d'une couleur connotée, et le rouge ou le vert ne servent qu'aux variations.",
            },
            {
              Icone: LinkIcon,
              titre: 'Chaque chiffre porte sa source',
              texte:
                "Une icône à côté de chaque montant renvoie au document officiel précis qui l'établit — pas au portail, au texte. Vous pouvez tout vérifier.",
            },
            {
              Icone: CodeIcon,
              titre: 'Open source, de bout en bout',
              texte:
                'Le site et le pipeline de données sont publiés sous licence AGPL. La méthode de calcul est vérifiable, y compris ses limites, qui sont affichées et non enfouies.',
            },
            {
              Icone: ListIcon,
              titre: 'La profondeur est offerte, jamais imposée',
              texte:
                "Trois chiffres suffisent à repartir avec une idée juste. Mais si vous voulez descendre jusqu'à l'action budgétaire d'un programme, rien ne vous arrête.",
            },
          ].map(({ Icone, titre, texte }) => (
            <div key={titre} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px]
                  bg-accent-soft text-accent"
              >
                <Icone className="h-[19px] w-[19px]" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">{titre}</h3>
                <p className="mt-1 text-[14.5px] text-ink-muted">{texte}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─────────── D'où viennent les données ─────────── */}
      <Section id="donnees" bande>
        <TitreSection
          titre="D'où viennent les données"
          chapeau="Uniquement de sources publiques officielles, réutilisables sous Licence Ouverte 2.0. Rien n'est estimé pour combler un trou : quand une donnée manque, le site le dit."
        />

        <div className="mt-9 grid gap-3.5 md:grid-cols-3">
          {[
            {
              nom: 'Légifrance — lois de finances',
              detail:
                premiereAnneeHistorique !== undefined && derniereAnnee !== undefined
                  ? `Dépenses, recettes et solde, de ${premiereAnneeHistorique} à ${derniereAnnee}. Mise à jour annuelle.`
                  : 'Dépenses, recettes et solde. Mise à jour annuelle.',
            },
            {
              nom: 'data.gouv.fr — DECP',
              detail: marches
                ? `${marches.total.toLocaleString('fr-FR')} marchés publics. Mise à jour quotidienne.`
                : 'Les marchés publics. Mise à jour quotidienne.',
            },
            {
              nom: 'Annexe « Voies et moyens »',
              detail:
                "Les niches fiscales recensées par l'annexe du projet de loi de finances, dernier millésime exploitable.",
            },
          ].map((source) => (
            <div key={source.nom} className="rounded-lg border border-line bg-surface p-3.5">
              <b className="block text-sm font-semibold text-ink">{source.nom}</b>
              <span className="mt-1.5 block text-[13px] text-ink-muted">{source.detail}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/donnees"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface
              px-4 text-[14.5px] font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            Voir toutes les sources
          </Link>
        </div>
      </Section>

      {/* ─────────── Clôture ─────────── */}
      <div className="mx-auto w-full max-w-[1120px] px-6 pb-16">
        <div className="rounded-2xl border border-line bg-surface-sunken px-8 py-12 text-center sm:py-14">
          <h2 className="mx-auto max-w-[20ch] text-balance text-[clamp(24px,2.8vw,34px)] font-bold leading-[1.12] tracking-[-0.028em] text-ink">
            Commencez par le chiffre qui vous intéresse
          </h2>
          <p className="mx-auto mt-4 max-w-[56ch] text-[16.5px] text-ink-muted">
            L&apos;exercice {derniereAnnee ?? ''} en un coup d&apos;œil, ou votre propre contribution
            estimée à partir de votre revenu. Sans compte, sans traceur, sans conditions.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/tableau-de-bord"
              className="inline-flex h-10 items-center rounded-md border border-accent bg-accent
                px-5 text-[14.5px] font-semibold text-accent-contrast transition-colors
                hover:border-accent-hover hover:bg-accent-hover"
            >
              Explorer le budget {derniereAnnee ?? ''}
            </Link>
            <Link
              to="/mon-budget"
              className="inline-flex h-10 items-center rounded-md border border-line-strong
                bg-surface px-5 text-[14.5px] font-medium text-ink transition-colors
                hover:bg-surface-hover"
            >
              Calculer ma contribution
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, useReducedMotion } from 'framer-motion';

import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { SourceIcon } from '../components/ui/SourceIcon';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useIndicateur } from '../hooks/useIndicateur';
import { formatMd, soldeDepuisDeficit } from '../utils/format';

// Nombre moyen de secondes dans une année (365,25 jours, cohérent avec les
// années bissextiles) — utilisé uniquement pour l'indicateur "par seconde".
const SECONDES_PAR_AN = 365.25 * 24 * 60 * 60;

const parSecondeFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

interface AnimatedValueProps {
  value: number;
  format: (value: number) => string;
}

// Compteur animé (Framer Motion) : anime de 0 à `value` au montage / à chaque
// changement de valeur, sans dépendance à un composant supplémentaire.
function AnimatedValue({ value, format }: AnimatedValueProps) {
  const [display, setDisplay] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Respecte prefers-reduced-motion : affiche directement la valeur finale
    // plutôt que d'animer puis de couper court à l'animation (cf. cahier des
    // charges, section 6.2 : animations "désactivables (prefers-reduced-motion)").
    if (prefersReducedMotion) {
      setDisplay(value);
      return undefined;
    }

    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, prefersReducedMotion]);

  return <>{format(display)}</>;
}

export default function Home() {
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;

  const { data: budget } = useBudgetAnnee(derniereAnnee);
  const { data: indicateur } = useIndicateur(derniereAnnee);

  const parFrancaisParSeconde =
    budget && indicateur?.population
      ? budget.depensesNettes / indicateur.population / SECONDES_PAR_AN
      : null;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-ink">
          Le budget de l&apos;État, expliqué simplement
        </h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          BudgetCitoyen.fr rend le budget de l&apos;État français explorable par toutes et tous :
          missions, programmes, actions, dépenses et recettes.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink-muted">
            Dépenses totales {derniereAnnee ? `(${derniereAnnee})` : ''}
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {budget ? <AnimatedValue value={budget.depensesNettes} format={formatMd} /> : '—'}
            {budget && (
              <SourceIcon url={budget.sourceUrl} label={`dépenses ${derniereAnnee}`} />
            )}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">
            Recettes totales {derniereAnnee ? `(${derniereAnnee})` : ''}
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {budget ? <AnimatedValue value={budget.recettesNettes} format={formatMd} /> : '—'}
            {budget && (
              <SourceIcon url={budget.sourceUrl} label={`recettes ${derniereAnnee}`} />
            )}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">
            <GlossaryTerm term="déficit">Solde budgétaire</GlossaryTerm>{' '}
            {derniereAnnee ? `(${derniereAnnee})` : ''}
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {budget ? <AnimatedValue value={soldeDepuisDeficit(budget.deficit)} format={formatMd} /> : '—'}
            {budget && (
              <SourceIcon url={budget.sourceUrl} label={`déficit ${derniereAnnee}`} />
            )}
          </p>
        </Card>
      </section>

      <section>
        <Card>
          <p className="text-sm text-ink-muted">Dépense de l&apos;État par Français, chaque seconde</p>
          {parFrancaisParSeconde !== null ? (
            <p className="mt-1 text-2xl font-bold text-accent">
              <AnimatedValue value={parFrancaisParSeconde} format={parSecondeFormatter.format} />
              <span className="ml-1 text-sm font-normal text-ink-muted">
                / seconde
              </span>
              {(indicateur?.sourcePopulationUrl ?? indicateur?.sourcePibUrl) && (
                <SourceIcon
                  url={(indicateur?.sourcePopulationUrl ?? indicateur?.sourcePibUrl) as string}
                  label={`population ${derniereAnnee}`}
                />
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">
              Donnée de population non disponible pour {derniereAnnee ?? 'cette année'} : cet
              indicateur ne peut pas être calculé pour le moment.
            </p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Explorer</h2>
        <ul className="mt-2 flex flex-wrap gap-4">
          <li>
            <Link
              to="/tableau-de-bord"
              className="text-accent hover:underline "
            >
              Tableau de bord
            </Link>
          </li>
          <li>
            <Link to="/historique" className="text-accent hover:underline ">
              Historique
            </Link>
          </li>
          <li>
            <Link to="/comparer" className="text-accent hover:underline ">
              Comparateur
            </Link>
          </li>
          <li>
            <Link to="/mon-budget" className="text-accent hover:underline ">
              Mon budget
            </Link>
          </li>
          <li>
            <Link to="/simulateur" className="text-accent hover:underline ">
              Simulateur
            </Link>
          </li>
          <li>
            <Link
              to="/depenses-fiscales"
              className="text-accent hover:underline "
            >
              Niches fiscales
            </Link>
          </li>
          <li>
            <Link
              to="/marches-publics"
              className="text-accent hover:underline "
            >
              Marchés publics
            </Link>
          </li>
          <li>
            <Link to="/donnees" className="text-accent hover:underline ">
              Données
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

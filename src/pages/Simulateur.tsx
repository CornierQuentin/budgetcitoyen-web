import { useState } from 'react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissions } from '../hooks/useMissions';
import { useRecettes } from '../hooks/useRecettes';
import type { TypeRecette } from '../types/domain';
import { formatEcartMd, formatMd, soldeDepuisDeficit } from '../utils/format';
import { type AjustementLigne, simuler } from '../utils/simulateur';

type Mode = 'simple' | 'avance';

// Types de recette ajustables en mode avancé : les 4 types fiscaux du CDC
// (« recettes fiscales IR/TVA/IS/TICPE ») + AUTRES, à la demande explicite
// de l'utilisateur (retour direct sur cette page) — au départ exclu car pas
// une recette « fiscale » au sens strict du libellé CDC, mais l'utilisateur
// veut pouvoir l'ajuster comme les autres types.
const TYPES_RECETTE_AJUSTABLES: TypeRecette[] = ['IR', 'TVA', 'IS', 'TICPE', 'AUTRES'];

const PAS_CURSEUR = 5;
// Bornes larges (jusqu'à -100%, soit un définancement complet d'une ligne) :
// nécessaire pour que la saisie exacte d'un montant (cf. CurseurAjustement)
// puisse aller jusqu'à zéro, pas seulement -50%.
const AJUSTEMENT_MIN = -100;
const AJUSTEMENT_MAX = 200;

function clamp(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

interface CurseurAjustementProps {
  cle: string;
  libelle: string;
  montantActuel: number;
  ajustementPct: number;
  onChange: (pct: number) => void;
}

function CurseurAjustement({
  cle,
  libelle,
  montantActuel,
  ajustementPct,
  onChange,
}: CurseurAjustementProps) {
  const id = `curseur-${cle}`;
  const montant = montantActuel * (1 + ajustementPct / 100);

  // Deuxième façon d'ajuster une ligne, en plus du curseur : cliquer sur le
  // montant affiché le transforme en champ de saisie (montant exact en
  // Md€, même précision que l'affichage) — converti en pourcentage
  // d'ajustement à la validation, pour rester la seule source de vérité
  // partagée avec le curseur (pas de second état à synchroniser).
  const [enEdition, setEnEdition] = useState(false);
  const [brouillon, setBrouillon] = useState('');

  // Écart en euros entre le montant simulé et le montant réel de la mission.
  const impact = montant - montantActuel;
  // Rouge pour une dépense ajoutée, vert pour une dépense retirée : même
  // convention que le Comparateur, et la valeur reste écrite en toutes lettres
  // — la couleur n'est jamais le seul signal.
  let couleurImpact = 'text-ink-faint';
  if (impact > 0) couleurImpact = 'text-neg';
  else if (impact < 0) couleurImpact = 'text-pos';

  const commencerEdition = () => {
    // Arrondi au dixième de Md€, comme `formatMd` : les montants réels ne
    // sont pas des ronds exacts (ex. Défense ~ 60,0035 Md€, affiché
    // "60 Md€") - pré-remplir avec la division brute afficherait une valeur
    // qui ne correspond pas à ce que l'utilisateur vient de voir.
    setBrouillon((Math.round((montant / 1_000_000_000) * 10) / 10).toString());
    setEnEdition(true);
  };

  const validerEdition = () => {
    const montantSaisi = Number(brouillon.replace(',', '.'));
    if (Number.isFinite(montantSaisi) && montantActuel > 0) {
      const pct = clamp(
        ((montantSaisi * 1_000_000_000) / montantActuel - 1) * 100,
        AJUSTEMENT_MIN,
        AJUSTEMENT_MAX,
      );
      onChange(pct);
    }
    setEnEdition(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-3 py-1.5 text-sm">
      <label htmlFor={id} className="w-56 flex-none text-ink-muted">
        {libelle}
      </label>
      <input
        id={id}
        type="range"
        min={AJUSTEMENT_MIN}
        max={AJUSTEMENT_MAX}
        step={PAS_CURSEUR}
        value={ajustementPct}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 flex-1"
      />
      <span
        className={`w-14 flex-none text-right tabular-nums ${
          ajustementPct === 0 ? 'text-ink-muted' : 'font-semibold text-accent'
        }`}
      >
        {ajustementPct >= 0 ? '+' : ''}
        {Math.round(ajustementPct)}%
      </span>
      {enEdition ? (
        <input
          type="number"
          step="0.1"
          ref={(element) => element?.focus()}
          value={brouillon}
          onChange={(event) => setBrouillon(event.target.value)}
          onBlur={validerEdition}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') setEnEdition(false);
          }}
          aria-label={`Montant exact pour ${libelle} (Md€)`}
          className="w-24 flex-none rounded border border-line-strong bg-surface px-1 py-0.5 text-right
            tabular-nums text-ink "
        />
      ) : (
        <button
          type="button"
          onClick={commencerEdition}
          title="Cliquer pour saisir un montant exact"
          className="w-24 flex-none text-right tabular-nums text-ink hover:text-accent
            "
        >
          {formatMd(montant)}
        </button>
      )}
      <span className={`w-24 flex-none text-right text-xs tabular-nums ${couleurImpact}`}>
        {impact === 0 ? '—' : formatEcartMd(impact)}
      </span>
    </li>
  );
}

export default function Simulateur() {
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;

  const {
    data: budget,
    isLoading: budgetEnCours,
    isError: budgetEnErreur,
  } = useBudgetAnnee(derniereAnnee);
  const { data: missions, isLoading: missionsEnCours } = useMissions(derniereAnnee);
  const { data: recettes, isLoading: recettesEnCours } = useRecettes(derniereAnnee);

  const [mode, setMode] = useState<Mode>('simple');
  const [ajustementsMissions, setAjustementsMissions] = useState<Record<string, number>>({});
  const [ajustementsRecettes, setAjustementsRecettes] = useState<Record<string, number>>({});

  const handleReinitialiser = () => {
    setAjustementsMissions({});
    setAjustementsRecettes({});
  };

  const isLoading = budgetEnCours || missionsEnCours || recettesEnCours;

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Chargement…</p>;
  }

  if (budgetEnErreur || !budget || !missions || !recettes) {
    return (
      <p className="text-sm text-ink-muted">
        Impossible de charger les données du simulateur pour le moment.
      </p>
    );
  }

  const missionsTriees = missions.slice().sort((a, b) => b.montantTotal - a.montantTotal);
  const missionsAjustees: AjustementLigne[] = missionsTriees.map((mission) => ({
    cle: mission.slug,
    montantActuel: mission.montantTotal,
    ajustementPct: ajustementsMissions[mission.slug] ?? 0,
  }));

  const recettesAjustables = TYPES_RECETTE_AJUSTABLES.map((type) =>
    recettes.find((recette) => recette.type === type),
  ).filter((recette): recette is NonNullable<typeof recette> => recette !== undefined);
  const recettesAjustees: AjustementLigne[] = recettesAjustables.map((recette) => ({
    cle: recette.type,
    montantActuel: recette.montantNet,
    ajustementPct: ajustementsRecettes[recette.type] ?? 0,
  }));

  const resultat = simuler(
    budget.depensesNettes,
    budget.recettesNettes,
    budget.deficit,
    missionsAjustees,
    mode === 'avance' ? recettesAjustees : [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">
            Simulateur — refaites le budget {derniereAnnee}
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Ajustez les dépenses et voyez l&apos;effet immédiat sur le{' '}
            <GlossaryTerm term="déficit">déficit</GlossaryTerm>.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div
            className="flex h-8 overflow-hidden rounded-md border border-line-strong"
            role="group"
            aria-label="Mode de simulation"
          >
            {(['simple', 'avance'] as const).map((valeur) => (
              <button
                key={valeur}
                type="button"
                onClick={() => setMode(valeur)}
                aria-pressed={mode === valeur}
                className={`border-r border-line px-3 text-[13px] font-medium last:border-r-0 ${
                  mode === valeur
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
                }`}
              >
                {valeur === 'simple' ? 'Mode simple' : 'Mode avancé'}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={handleReinitialiser}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Avertissement de neutralité (CDC principe 1.3, non négociable) :
          toujours visible, jamais masquable. */}
      <Card className="border-warn-line bg-warn-soft ">
        <p className="text-sm text-warn ">
          Ce simulateur recalcule uniquement l&apos;effet arithmétique de vos choix sur le{' '}
          <GlossaryTerm term="déficit">déficit</GlossaryTerm>, à partir des données réelles{' '}
          {derniereAnnee}. Il ne modélise aucun effet économique dynamique (croissance, emploi,
          inflation…) et ne suggère ni ne recommande aucune politique.
        </p>
      </Card>

      <div className="sticky top-14 z-10 -mx-4 bg-ground px-4 py-2 sm:-mx-5 sm:px-5">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-ink-muted">Dépenses simulées</p>
            <p className="mt-1 text-xl font-bold text-ink">{formatMd(resultat.depensesAjustees)}</p>
            {resultat.deltaDepenses !== 0 && (
              <p className={`text-sm ${resultat.deltaDepenses >= 0 ? 'text-neg' : 'text-pos'}`}>
                {formatEcartMd(resultat.deltaDepenses)}
              </p>
            )}
          </Card>
          <Card>
            <p className="text-sm text-ink-muted">
              Recettes simulées {mode === 'simple' && '(non ajustables en mode simple)'}
            </p>
            <p className="mt-1 text-xl font-bold text-ink">{formatMd(resultat.recettesAjustees)}</p>
            {resultat.deltaRecettes !== 0 && (
              <p className={`text-sm ${resultat.deltaRecettes >= 0 ? 'text-pos' : 'text-neg'}`}>
                {formatEcartMd(resultat.deltaRecettes)}
              </p>
            )}
          </Card>
          <Card className="border-accent-line">
            <p className="text-sm font-medium text-accent">Solde simulé</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-accent">
              {formatMd(soldeDepuisDeficit(resultat.deficitAjuste))}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="quiet">
                {resultat.deficitAjuste > 0 ? (
                  <GlossaryTerm term="déficit">Déficit</GlossaryTerm>
                ) : (
                  'Excédent'
                )}
              </Badge>
              {resultat.deltaDeficit !== 0 && (
                /* On affiche l'écart DU SOLDE, pas celui du déficit : un solde
                   qui monte est une amélioration arithmétique, et le signe veut
                   ainsi dire la même chose que partout ailleurs sur le site. */
                <span
                  className={`text-xs tabular-nums ${
                    resultat.deltaDeficit > 0 ? 'text-neg' : 'text-pos'
                  }`}
                >
                  {formatEcartMd(soldeDepuisDeficit(resultat.deltaDeficit))} vs budget réel
                </span>
              )}
            </p>
          </Card>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink">Dépenses par mission</h2>
        <ul className="mt-2 divide-y divide-line">
          {missionsTriees.map((mission) => (
            <CurseurAjustement
              key={mission.slug}
              cle={mission.slug}
              libelle={mission.nomOfficiel}
              montantActuel={mission.montantTotal}
              ajustementPct={ajustementsMissions[mission.slug] ?? 0}
              onChange={(pct) =>
                setAjustementsMissions((precedent) => ({ ...precedent, [mission.slug]: pct }))
              }
            />
          ))}
        </ul>
      </section>

      {mode === 'avance' && (
        <section>
          <h2 className="text-lg font-semibold text-ink">Recettes</h2>
          <ul className="mt-2 divide-y divide-line">
            {recettesAjustables.map((recette) => (
              <CurseurAjustement
                key={recette.type}
                cle={recette.type}
                libelle={recette.type}
                montantActuel={recette.montantNet}
                ajustementPct={ajustementsRecettes[recette.type] ?? 0}
                onChange={(pct) =>
                  setAjustementsRecettes((precedent) => ({ ...precedent, [recette.type]: pct }))
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

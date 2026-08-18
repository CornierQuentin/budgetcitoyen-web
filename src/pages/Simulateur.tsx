import { useState } from 'react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissions } from '../hooks/useMissions';
import { useRecettes } from '../hooks/useRecettes';
import type { TypeRecette } from '../types/domain';
import { formatMd } from '../utils/format';
import { type AjustementLigne, simuler } from '../utils/simulateur';

type Mode = 'simple' | 'avance';

// Seuls les types de recette FISCAUX sont ajustables en mode avancé (libellé
// CDC : « recettes fiscales IR/TVA/IS/TICPE ») — AUTRES (recettes non
// fiscales et fourre-tout) en est explicitement exclu.
const TYPES_RECETTE_AJUSTABLES: TypeRecette[] = ['IR', 'TVA', 'IS', 'TICPE'];

const PAS_CURSEUR = 5;
const AJUSTEMENT_MIN = -50;
const AJUSTEMENT_MAX = 100;

function formatDeltaMd(montant: number): string {
  return `${montant >= 0 ? '+' : ''}${formatMd(montant)}`;
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
  return (
    <li className="flex flex-wrap items-center gap-3 py-1.5 text-sm">
      <label htmlFor={id} className="w-56 flex-none truncate text-gray-700 dark:text-gray-300">
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
      <span className="w-14 flex-none text-right tabular-nums text-gray-500 dark:text-gray-400">
        {ajustementPct >= 0 ? '+' : ''}
        {ajustementPct}%
      </span>
      <span className="w-24 flex-none text-right tabular-nums text-gray-900 dark:text-gray-100">
        {formatMd(montantActuel * (1 + ajustementPct / 100))}
      </span>
    </li>
  );
}

export default function Simulateur() {
  const { data: annees } = useAnnees();
  const derniereAnnee =
    annees && annees.length > 0 ? Math.max(...annees.map((item) => item.annee)) : undefined;

  const { data: budget, isLoading: budgetEnCours, isError: budgetEnErreur } =
    useBudgetAnnee(derniereAnnee);
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
    return <p className="text-sm text-gray-500 dark:text-gray-400">Chargement…</p>;
  }

  if (budgetEnErreur || !budget || !missions || !recettes) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
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

  const recettesFiscales = TYPES_RECETTE_AJUSTABLES.map((type) =>
    recettes.find((recette) => recette.type === type),
  ).filter((recette): recette is NonNullable<typeof recette> => recette !== undefined);
  const recettesAjustees: AjustementLigne[] = recettesFiscales.map((recette) => ({
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Simulateur budgétaire — Refais le budget {derniereAnnee}
      </h1>

      {/* Avertissement de neutralité (CDC principe 1.3, non négociable) :
          toujours visible, jamais masquable. */}
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          Ce simulateur recalcule uniquement l&apos;effet arithmétique de vos choix sur le{' '}
          <GlossaryTerm term="déficit">déficit</GlossaryTerm>, à partir des données réelles{' '}
          {derniereAnnee}. Il ne modélise aucun effet économique dynamique (croissance, emploi,
          inflation…) et ne suggère ni ne recommande aucune politique.
        </p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={mode === 'simple' ? 'primary' : 'secondary'}
            onClick={() => setMode('simple')}
            aria-pressed={mode === 'simple'}
          >
            Mode simple
          </Button>
          <Button
            variant={mode === 'avance' ? 'primary' : 'secondary'}
            onClick={() => setMode('avance')}
            aria-pressed={mode === 'avance'}
          >
            Mode avancé
          </Button>
        </div>
        <Button variant="secondary" onClick={handleReinitialiser}>
          Réinitialiser
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dépenses simulées</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatMd(resultat.depensesAjustees)}
          </p>
          {resultat.deltaDepenses !== 0 && (
            <p
              className={`text-sm ${
                resultat.deltaDepenses >= 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
              }`}
            >
              {formatDeltaMd(resultat.deltaDepenses)}
            </p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recettes simulées {mode === 'simple' && '(non ajustables en mode simple)'}
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatMd(resultat.recettesAjustees)}
          </p>
          {resultat.deltaRecettes !== 0 && (
            <p
              className={`text-sm ${
                resultat.deltaRecettes >= 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {formatDeltaMd(resultat.deltaRecettes)}
            </p>
          )}
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <GlossaryTerm term="déficit">Déficit</GlossaryTerm> simulé
          </p>
          <p className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-100">
            {formatMd(resultat.deficitAjuste)}
          </p>
          {resultat.deltaDeficit !== 0 && (
            <p
              className={`text-sm ${
                resultat.deltaDeficit >= 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
              }`}
            >
              {formatDeltaMd(resultat.deltaDeficit)}
            </p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Dépenses par mission
        </h2>
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recettes fiscales
          </h2>
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
            {recettesFiscales.map((recette) => (
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

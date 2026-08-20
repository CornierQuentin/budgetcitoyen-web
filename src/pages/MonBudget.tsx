import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useBudgetPerso } from '../hooks/useBudgetPerso';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatEuros, formatPct } from '../utils/format';
import { parseIntSearchParam } from '../utils/searchParams';

// Trois repères de revenu, pour qu'un visiteur puisse voir un résultat sans
// avoir à saisir sa propre situation.
const REVENUS_EXEMPLES = [1500, 2000, 3500];

export default function MonBudget() {
  const [searchParams, setSearchParams] = useSearchParams();

  // `?revenu_net=` permet de partager un résultat déjà calculé : s'il est
  // présent, il pré-remplit le formulaire et déclenche directement le calcul
  // (pas seulement le champ), pour que la vue partagée affiche le résultat.
  // En l'absence de valeur dans l'URL, la page affiche par défaut une
  // estimation pour 2000€/mois plutôt qu'un formulaire vide, pour que le
  // résultat (et la méthodologie) soit visible dès l'arrivée sur la page.
  const revenuParam = parseIntSearchParam(searchParams.get('revenu_net'));
  const revenuInitialValide = revenuParam !== undefined && revenuParam >= 0 ? revenuParam : 2000;

  const [revenuNetMensuel, setRevenuNetMensuel] = useState(
    revenuInitialValide !== undefined ? String(revenuInitialValide) : '',
  );

  // Recalcul au fil de la saisie plutôt qu'au clic : attendre un bouton pour
  // voir un chiffre qu'on vient de taper est une friction inutile. Le délai
  // anti-rebond évite une requête par frappe (même valeur que la recherche des
  // marchés publics).
  const revenuDebounce = useDebouncedValue(revenuNetMensuel, 400);
  const revenuCalcule = (() => {
    const valeur = Number(revenuDebounce);
    return revenuDebounce !== '' && Number.isFinite(valeur) && valeur >= 0 ? valeur : undefined;
  })();

  const { data: budgetPerso, isLoading, isError } = useBudgetPerso(revenuCalcule);

  // L'URL suit le revenu réellement calculé, pour rester partageable.
  useEffect(() => {
    if (revenuCalcule === undefined) return;
    if (searchParams.get('revenu_net') === String(revenuCalcule)) return;
    const next = new URLSearchParams(searchParams);
    next.set('revenu_net', String(revenuCalcule));
    setSearchParams(next, { replace: true });
  }, [revenuCalcule, searchParams, setSearchParams]);

  // Le formulaire reste soumissible (touche Entrée) : il n'a plus rien à
  // déclencher, le calcul est déjà en cours, mais l'empêcher de recharger la
  // page reste nécessaire.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  // Triée par montant décroissant. Une trentaine de missions sont concernées :
  // un donut catégoriel n'est pas adapté au-delà de 8 séries (voir DonutChart),
  // une liste classée avec barre de magnitude (une seule teinte) convient mieux.
  const repartitionTriee = (budgetPerso?.repartition ?? [])
    .slice()
    .sort((a, b) => b.montant - a.montant);
  const repartitionMax = repartitionTriee.reduce((max, item) => Math.max(max, item.montant), 0);
  const repartitionTotal = repartitionTriee.reduce((sum, item) => sum + item.montant, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.02em] text-ink">Mon budget</h1>
        <p className="mt-0.5 max-w-prose text-[13px] text-ink-muted">
          Estimez votre contribution personnelle au budget de l&apos;État, et voyez ce qu&apos;elle
          finance.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-5">
          <label
            htmlFor="revenu-net-mensuel"
            className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted"
          >
            Votre revenu net mensuel (€)
            <input
              id="revenu-net-mensuel"
              type="number"
              min={0}
              step={1}
              value={revenuNetMensuel}
              onChange={(event) => setRevenuNetMensuel(event.target.value)}
              className="h-10 w-48 rounded-md border border-line-strong bg-surface px-3 text-lg
                font-bold tabular-nums text-ink"
              placeholder="2000"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="text-xs text-ink-muted">Exemples :</span>
            {REVENUS_EXEMPLES.map((montant) => (
              <Button
                key={montant}
                variant="secondary"
                size="sm"
                onClick={() => setRevenuNetMensuel(String(montant))}
              >
                {formatEuros(montant)}
              </Button>
            ))}
          </div>
        </form>
      </Card>

      {isLoading && <p className="text-sm text-ink-muted">Calcul en cours…</p>}
      {isError && (
        <p className="text-sm text-neg">
          Une erreur est survenue lors du calcul. Réessayez avec une autre valeur.
        </p>
      )}

      {budgetPerso && (
        <div className="space-y-6">
          <section aria-label="Contribution estimée" className="grid gap-4 sm:grid-cols-3">
            <Card className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-ink-muted">
                Impôt sur le revenu estimé
              </span>
              <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
                {formatEuros(budgetPerso.irEstime)} / an
              </span>
              <span className="text-xs tabular-nums text-ink-faint">
                soit {formatEuros(budgetPerso.irEstime / 12)} par mois
              </span>
            </Card>
            <Card className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-medium text-ink-muted">TVA estimée</span>
              <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-ink">
                {formatEuros(budgetPerso.tvaEstimee)} / an
              </span>
              <span className="text-xs tabular-nums text-ink-faint">
                soit {formatEuros(budgetPerso.tvaEstimee / 12)} par mois
              </span>
            </Card>
            <Card className="flex flex-col gap-1.5 border-accent-line">
              <span className="text-[12.5px] font-medium text-accent">
                Contribution totale estimée
              </span>
              <span className="text-2xl font-bold tracking-[-0.028em] tabular-nums text-accent">
                {formatEuros(budgetPerso.contributionTotaleEstimee)} / an
              </span>
              <span className="text-xs tabular-nums text-ink-faint">
                soit {formatEuros(budgetPerso.contributionTotaleEstimee / 12)} par mois
              </span>
            </Card>
          </section>

          <Card
            flush
            title={<>Où vont vos {formatEuros(budgetPerso.contributionTotaleEstimee)}</>}
            note={`répartition selon le budget ${budgetPerso.anneeReference}`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="border-b border-line px-4 py-2.5 text-left text-[11.5px]
                        font-semibold uppercase tracking-[0.04em] text-ink-faint"
                    >
                      <GlossaryTerm term="Mission">Mission</GlossaryTerm>
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-line px-4 py-2.5 text-right
                        text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-faint"
                    >
                      Par an
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-line px-4 py-2.5 text-right
                        text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-faint"
                    >
                      Par mois
                    </th>
                    <th
                      scope="col"
                      className="hidden border-b border-line px-4 py-2.5 text-left text-[11.5px]
                        font-semibold uppercase tracking-[0.04em] text-ink-faint sm:table-cell"
                    >
                      Part
                    </th>
                    <th
                      scope="col"
                      className="border-b border-line px-4 py-2.5 text-right text-[11.5px]
                        font-semibold uppercase tracking-[0.04em] text-ink-faint"
                    >
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {repartitionTriee.map((item) => (
                    <tr
                      key={item.missionSlug}
                      className="border-b border-line last:border-b-0 hover:bg-surface-hover"
                    >
                      <td className="px-4 py-2.5 font-medium text-ink">{item.missionNom}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-muted">
                        {formatEuros(item.montant)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-muted">
                        {formatEuros(item.montant / 12)}
                      </td>
                      {/* Redondance visuelle de la colonne « % » : masquée aux
                          technologies d'assistance. */}
                      <td aria-hidden="true" className="hidden w-[140px] px-4 py-2.5 sm:table-cell">
                        <span className="block h-1.5 w-full overflow-hidden rounded-sm bg-bar-track">
                          <span
                            className="block h-full rounded-sm bg-bar"
                            style={{
                              width: `${
                                repartitionMax > 0 ? (item.montant / repartitionMax) * 100 : 0
                              }%`,
                            }}
                          />
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-ink-faint">
                        {formatPct(repartitionTotal > 0 ? item.montant / repartitionTotal : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <section>
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-ink">Méthodologie</h2>
              <p className="text-sm text-ink-muted">
                Ce calcul est une estimation arithmétique simplifiée, présentée à titre pédagogique.
                Elle ne remplace pas un calcul d&apos;impôt réel et ne modélise aucun effet
                économique dynamique.
              </p>

              <div>
                <h3 className="text-sm font-semibold text-ink-muted">Hypothèses</h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-muted">
                  {budgetPerso.methodologie.hypotheses.map((hypothese) => (
                    <li key={hypothese}>{hypothese}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-muted">Limites</h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-muted">
                  {budgetPerso.methodologie.limites.map((limite) => (
                    <li key={limite}>{limite}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink-muted">Sources</h3>
                <ul className="mt-1 space-y-1 text-sm">
                  {budgetPerso.methodologie.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline "
                      >
                        {source.nom}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

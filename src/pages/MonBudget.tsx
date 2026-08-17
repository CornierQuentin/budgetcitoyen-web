import { useState, type FormEvent } from 'react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GlossaryTerm } from '../components/ui/GlossaryTerm';
import { useBudgetPerso } from '../hooks/useBudgetPerso';
import { formatEuros, formatPct } from '../utils/format';

export default function MonBudget() {
  const [revenuNetMensuel, setRevenuNetMensuel] = useState('');
  const [revenuSoumis, setRevenuSoumis] = useState<number | undefined>(undefined);

  const { data: budgetPerso, isLoading, isError } = useBudgetPerso(revenuSoumis);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valeur = Number(revenuNetMensuel);
    if (Number.isFinite(valeur) && valeur >= 0) {
      setRevenuSoumis(valeur);
    }
  };

  // Triée par montant décroissant. Une trentaine de missions sont concernées :
  // un donut catégoriel n'est pas adapté au-delà de 8 séries (voir DonutChart),
  // une liste classée avec barre de magnitude (une seule teinte) convient mieux.
  const repartitionTriee = (budgetPerso?.repartition ?? [])
    .slice()
    .sort((a, b) => b.montant - a.montant);
  const repartitionMax = repartitionTriee.reduce(
    (max, item) => Math.max(max, item.montant),
    0,
  );
  const repartitionTotal = repartitionTriee.reduce((sum, item) => sum + item.montant, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mon budget</h1>
      <p className="max-w-2xl text-gray-600 dark:text-gray-300">
        Estimez votre contribution personnelle au budget de l&apos;État à partir de votre revenu
        net mensuel, et la façon dont elle se répartit entre les grandes missions de l&apos;État.
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label
            htmlFor="revenu-net-mensuel"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Revenu net mensuel (€)
            <input
              id="revenu-net-mensuel"
              type="number"
              min={0}
              step={1}
              value={revenuNetMensuel}
              onChange={(event) => setRevenuNetMensuel(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm
                dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="2000"
            />
          </label>
        </div>

        <Button type="submit">Calculer</Button>
      </form>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Calcul en cours…</p>
      )}
      {isError && (
        <p className="text-sm text-red-700 dark:text-red-400">
          Une erreur est survenue lors du calcul. Réessayez avec une autre valeur.
        </p>
      )}

      {budgetPerso && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500 dark:text-gray-400">Impôt sur le revenu estimé</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatEuros(budgetPerso.irEstime)} / an
              </p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 dark:text-gray-400">TVA estimée</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatEuros(budgetPerso.tvaEstimee)} / an
              </p>
            </Card>
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-200">Contribution totale estimée</p>
              <p className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-100">
                {formatEuros(budgetPerso.contributionTotaleEstimee)} / an
              </p>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Répartition par <GlossaryTerm term="Mission">mission</GlossaryTerm> (année{' '}
              {budgetPerso.anneeReference})
            </h2>
            <ul className="mt-3 space-y-1.5">
              {repartitionTriee.map((item) => (
                <li key={item.missionSlug} className="flex items-center gap-3 text-sm">
                  <span
                    className="w-56 flex-none truncate text-gray-700 dark:text-gray-300"
                    title={item.missionNom}
                  >
                    {item.missionNom}
                  </span>
                  <span className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    <span
                      className="block h-2 rounded-full bg-blue-700 dark:bg-blue-500"
                      style={{
                        width: `${repartitionMax > 0 ? (item.montant / repartitionMax) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  <span className="w-20 flex-none text-right text-gray-600 dark:text-gray-300">
                    {formatEuros(item.montant)}
                  </span>
                  <span className="w-14 flex-none text-right text-gray-400 dark:text-gray-500">
                    {formatPct(repartitionTotal > 0 ? item.montant / repartitionTotal : 0)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Méthodologie
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ce calcul est une estimation arithmétique simplifiée, présentée à titre pédagogique.
                Elle ne remplace pas un calcul d&apos;impôt réel et ne modélise aucun effet
                économique dynamique.
              </p>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Hypothèses
                </h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {budgetPerso.methodologie.hypotheses.map((hypothese) => (
                    <li key={hypothese}>{hypothese}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Limites</h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {budgetPerso.methodologie.limites.map((limite) => (
                    <li key={limite}>{limite}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sources</h3>
                <ul className="mt-1 space-y-1 text-sm">
                  {budgetPerso.methodologie.sources.map((source) => (
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
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

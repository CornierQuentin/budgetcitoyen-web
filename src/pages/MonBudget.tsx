import { useState, type FormEvent } from 'react';

import DonutChart from '../components/charts/DonutChart';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useBudgetPerso } from '../hooks/useBudgetPerso';
import { formatEuros } from '../utils/format';

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

  const repartitionData = (budgetPerso?.repartition ?? []).map((item) => ({
    label: item.missionNom,
    value: item.montant,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon budget</h1>
      <p className="max-w-2xl text-gray-600">
        Estimez votre contribution personnelle au budget de l&apos;État à partir de votre revenu
        net mensuel, et la façon dont elle se répartit entre les grandes missions de l&apos;État.
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label htmlFor="revenu-net-mensuel" className="block text-sm font-medium text-gray-700">
            Revenu net mensuel (€)
            <input
              id="revenu-net-mensuel"
              type="number"
              min={0}
              step={1}
              value={revenuNetMensuel}
              onChange={(event) => setRevenuNetMensuel(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="2000"
            />
          </label>
        </div>

        <Button type="submit">Calculer</Button>
      </form>

      {isLoading && <p className="text-sm text-gray-500">Calcul en cours…</p>}
      {isError && (
        <p className="text-sm text-red-700">
          Une erreur est survenue lors du calcul. Réessayez avec une autre valeur.
        </p>
      )}

      {budgetPerso && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500">Impôt sur le revenu estimé</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatEuros(budgetPerso.irEstime)} / an
              </p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">TVA estimée</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatEuros(budgetPerso.tvaEstimee)} / an
              </p>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <p className="text-sm text-blue-900">Contribution totale estimée</p>
              <p className="mt-1 text-xl font-bold text-blue-900">
                {formatEuros(budgetPerso.contributionTotaleEstimee)} / an
              </p>
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Répartition par mission (année {budgetPerso.anneeReference})
            </h2>
            <div className="mt-3">
              <DonutChart data={repartitionData} />
            </div>
          </section>

          <section>
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Méthodologie</h2>
              <p className="text-sm text-gray-600">
                Ce calcul est une estimation arithmétique simplifiée, présentée à titre pédagogique.
                Elle ne remplace pas un calcul d&apos;impôt réel et ne modélise aucun effet
                économique dynamique.
              </p>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Hypothèses</h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-600">
                  {budgetPerso.methodologie.hypotheses.map((hypothese) => (
                    <li key={hypothese}>{hypothese}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Limites</h3>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-600">
                  {budgetPerso.methodologie.limites.map((limite) => (
                    <li key={limite}>{limite}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Sources</h3>
                <ul className="mt-1 space-y-1 text-sm">
                  {budgetPerso.methodologie.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-800 hover:underline"
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

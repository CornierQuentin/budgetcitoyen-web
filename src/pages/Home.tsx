import { Link } from 'react-router-dom';

import { Card } from '../components/ui/Card';

export function Home() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-gray-900">
          Le budget de l&apos;État, expliqué simplement
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          BudgetCitoyen.fr rend le budget de l&apos;État français explorable par toutes et tous :
          missions, programmes, actions, dépenses et recettes.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Dépenses totales</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">— à venir</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Recettes totales</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">— à venir</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Solde budgétaire</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">— à venir</p>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Explorer</h2>
        <ul className="mt-2 flex flex-wrap gap-4">
          <li>
            <Link to="/tableau-de-bord" className="text-blue-800 hover:underline">
              Tableau de bord
            </Link>
          </li>
          <li>
            <Link to="/historique" className="text-blue-800 hover:underline">
              Historique
            </Link>
          </li>
          <li>
            <Link to="/comparer" className="text-blue-800 hover:underline">
              Comparateur
            </Link>
          </li>
          <li>
            <Link to="/mon-budget" className="text-blue-800 hover:underline">
              Mon budget
            </Link>
          </li>
          <li>
            <Link to="/donnees" className="text-blue-800 hover:underline">
              Données
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default Home;

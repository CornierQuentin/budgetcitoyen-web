interface SourceDonnee {
  nom: string;
  url: string;
}

const sources: SourceDonnee[] = [
  { nom: 'data.gouv.fr', url: 'https://www.data.gouv.fr/' },
  { nom: 'performance-publique.budget.gouv.fr', url: 'https://www.performance-publique.budget.gouv.fr/' },
  { nom: 'Direction du budget (budget.gouv.fr)', url: 'https://www.budget.gouv.fr/' },
  { nom: "Documents budgétaires de l'Assemblée nationale", url: 'https://www.assemblee-nationale.fr/' },
];

export function Donnees() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Données</h1>
      <p className="text-gray-600">
        Les données présentées sur BudgetCitoyen.fr proviennent de sources publiques officielles.
      </p>

      <ul className="space-y-2">
        {sources.map((source) => (
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
  );
}

export default Donnees;

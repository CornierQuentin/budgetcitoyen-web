import { useState } from 'react';

import LineChart from '../components/charts/LineChart';

const ANNEE_MIN = 2010;
const ANNEE_MAX = new Date().getFullYear();

export function Historique() {
  const [annee, setAnnee] = useState(ANNEE_MAX);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historique</h1>

      <LineChart data={[]} />

      <div>
        <label htmlFor="annee-historique" className="block text-sm font-medium text-gray-700">
          Année : {annee}
        </label>
        <input
          id="annee-historique"
          type="range"
          min={ANNEE_MIN}
          max={ANNEE_MAX}
          value={annee}
          onChange={(event) => setAnnee(Number(event.target.value))}
          className="mt-2 w-full max-w-md"
        />
      </div>
    </div>
  );
}

export default Historique;

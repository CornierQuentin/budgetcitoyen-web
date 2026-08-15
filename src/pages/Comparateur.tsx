import { useState } from 'react';

const ANNEE_MAX = new Date().getFullYear();
const ANNEES = Array.from({ length: 10 }, (_, index) => ANNEE_MAX - index);

export default function Comparateur() {
  const [anneeA, setAnneeA] = useState(ANNEES[1]);
  const [anneeB, setAnneeB] = useState(ANNEES[0]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Comparateur</h1>

      <div className="flex flex-wrap gap-6">
        <div>
          <label htmlFor="annee-a" className="block text-sm font-medium text-gray-700">
            Année A
            <select
              id="annee-a"
              value={anneeA}
              onChange={(event) => setAnneeA(Number(event.target.value))}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {ANNEES.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label htmlFor="annee-b" className="block text-sm font-medium text-gray-700">
            Année B
            <select
              id="annee-b"
              value={anneeB}
              onChange={(event) => setAnneeB(Number(event.target.value))}
              className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {ANNEES.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}


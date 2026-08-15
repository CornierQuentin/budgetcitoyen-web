import { useState, type FormEvent } from 'react';

import { Button } from '../components/ui/Button';

export function MonBudget() {
  const [revenuNetMensuel, setRevenuNetMensuel] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO Phase 1 : calculer la contribution personnelle au budget de l'État.
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon budget</h1>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label htmlFor="revenu-net-mensuel" className="block text-sm font-medium text-gray-700">
            Revenu net mensuel (€)
          </label>
          <input
            id="revenu-net-mensuel"
            type="number"
            min={0}
            step={1}
            value={revenuNetMensuel}
            onChange={(event) => setRevenuNetMensuel(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            placeholder="2000"
          />
        </div>

        <Button type="submit">Calculer</Button>
      </form>
    </div>
  );
}

export default MonBudget;

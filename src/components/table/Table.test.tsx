import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Table, type TableColumn } from './Table';

interface Ligne {
  id: string;
  nom: string;
  montant: number;
}

const colonnes: TableColumn<Ligne>[] = [
  { key: 'nom', header: 'Nom', render: (row) => row.nom },
  { key: 'montant', header: 'Montant', align: 'right', render: (row) => `${row.montant} €` },
];

describe('Table', () => {
  it('affiche les en-têtes et les lignes fournies', () => {
    const rows: Ligne[] = [
      { id: '1', nom: 'Alpha', montant: 100 },
      { id: '2', nom: 'Beta', montant: 200 },
    ];

    render(
      <Table columns={colonnes} rows={rows} getRowKey={(row) => row.id} emptyMessage="Aucune" />,
    );

    expect(screen.getByRole('columnheader', { name: 'Nom' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '200 €' })).toBeInTheDocument();
  });

  it("affiche le message vide quand il n'y a aucune ligne", () => {
    render(<Table columns={colonnes} rows={[]} getRowKey={(row) => row.id} emptyMessage="Aucune ligne" />);

    expect(screen.getByText('Aucune ligne')).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Alpha' })).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useDepensesFiscales, useDepensesFiscalesAnnees } from '../hooks/useDepensesFiscales';
import type { DepenseFiscale } from '../types/domain';

function creerDepensesMock(): DepenseFiscale[] {
  return [
    {
      annee: 2021,
      numero: '210324',
      categorie: 'Impôt sur le revenu et impôt sur les sociétés',
      sousCategorie: 'Dispositions communes',
      sousSousCategorie: 'Dispositions diverses',
      libelle: "Crédit d'impôt en faveur de la compétitivité et de l'emploi",
      beneficiaire: 'Entreprises',
      montantMillions: 6920,
      statutMontant: 'chiffre',
      methodeChiffrage: 'Simulation',
    },
    {
      annee: 2021,
      numero: '40101',
      categorie: 'Impôts locaux',
      sousCategorie: 'Cotisation sur la valeur ajoutée des entreprises',
      sousSousCategorie: null,
      libelle: 'Exonération en faveur des entreprises en ZRR',
      beneficiaire: 'Entreprises',
      montantMillions: null,
      statutMontant: 'epsilon',
      methodeChiffrage: null,
    },
    {
      annee: 2021,
      numero: '110307',
      categorie: 'Impôt sur le revenu',
      sousCategorie: 'Dispositions diverses',
      sousSousCategorie: null,
      libelle: "Réduction d'impôt non calculable",
      beneficiaire: 'Ménages',
      montantMillions: null,
      statutMontant: 'non_calculable',
      methodeChiffrage: null,
    },
  ];
}

vi.mock('../hooks/useDepensesFiscales', () => ({
  useDepensesFiscalesAnnees: vi.fn(() => ({ data: [2021] })),
  useDepensesFiscales: vi.fn(() => ({ data: undefined })),
}));

const mockedUseDepensesFiscales = vi.mocked(useDepensesFiscales);
const mockedUseDepensesFiscalesAnnees = vi.mocked(useDepensesFiscalesAnnees);

// eslint-disable-next-line import/first
import DepensesFiscales from './DepensesFiscales';

function renderPage() {
  return render(
    <MemoryRouter>
      <DepensesFiscales />
    </MemoryRouter>,
  );
}

describe('DepensesFiscales', () => {
  it('affiche le bandeau de millésime, la liste et exclut les mesures non chiffrables du total', () => {
    mockedUseDepensesFiscalesAnnees.mockReturnValue({
      data: [2021],
    } as ReturnType<typeof useDepensesFiscalesAnnees>);
    mockedUseDepensesFiscales.mockReturnValue({
      data: creerDepensesMock(),
    } as ReturnType<typeof useDepensesFiscales>);

    renderPage();

    expect(screen.getByText(/Données 2021/)).toBeInTheDocument();
    expect(screen.getByText(/total chiffré 6,9 Md€/)).toBeInTheDocument();
    expect(screen.getByText(/2 mesures sur 3/)).toBeInTheDocument();

    expect(
      screen.getByRole('cell', { name: "Crédit d'impôt en faveur de la compétitivité et de l'emploi" }),
    ).toBeInTheDocument();
    expect(screen.getByText('ε (< 0,5 M€)')).toBeInTheDocument();
    expect(screen.getByText('nc')).toBeInTheDocument();
  });

  it("ne montre pas de sélecteur d'année quand une seule est disponible", () => {
    mockedUseDepensesFiscalesAnnees.mockReturnValue({
      data: [2021],
    } as ReturnType<typeof useDepensesFiscalesAnnees>);
    mockedUseDepensesFiscales.mockReturnValue({
      data: creerDepensesMock(),
    } as ReturnType<typeof useDepensesFiscales>);

    renderPage();

    expect(screen.queryByLabelText('Année')).not.toBeInTheDocument();
  });

  it('filtre la liste au fil de la frappe, insensible à la casse et aux accents', () => {
    mockedUseDepensesFiscalesAnnees.mockReturnValue({
      data: [2021],
    } as ReturnType<typeof useDepensesFiscalesAnnees>);
    mockedUseDepensesFiscales.mockReturnValue({
      data: creerDepensesMock(),
    } as ReturnType<typeof useDepensesFiscales>);

    renderPage();

    fireEvent.change(screen.getByLabelText(/rechercher une mesure/i), {
      target: { value: 'menages' },
    });

    expect(
      screen.getByRole('cell', { name: "Réduction d'impôt non calculable" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('cell', {
        name: "Crédit d'impôt en faveur de la compétitivité et de l'emploi",
      }),
    ).not.toBeInTheDocument();
  });

  it('affiche un bouton export CSV quand des données sont chargées', () => {
    mockedUseDepensesFiscalesAnnees.mockReturnValue({
      data: [2021],
    } as ReturnType<typeof useDepensesFiscalesAnnees>);
    mockedUseDepensesFiscales.mockReturnValue({
      data: creerDepensesMock(),
    } as ReturnType<typeof useDepensesFiscales>);

    renderPage();

    expect(screen.getByRole('button', { name: /exporter csv/i })).toBeInTheDocument();
  });
});

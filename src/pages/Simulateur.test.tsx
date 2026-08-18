import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnnees } from '../hooks/useAnnees';
import { useBudgetAnnee } from '../hooks/useBudgetAnnee';
import { useMissions } from '../hooks/useMissions';
import { useRecettes } from '../hooks/useRecettes';
import type { AnneeBudget, AnneeBudgetDetail, Mission, Recette } from '../types/domain';

const anneesMock: AnneeBudget[] = [
  { annee: 2024, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2025, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
];

const budgetMock: AnneeBudgetDetail = {
  annee: 2025,
  depensesNettes: 600_000_000_000,
  recettesNettes: 450_000_000_000,
  deficit: 150_000_000_000,
  dettePib: null,
  sourceUrl: 'https://example.org/budget-2025',
};

const missionsMock: Mission[] = [
  {
    id: 1,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2025,
    montantTotal: 60_000_000_000,
  },
  {
    id: 2,
    slug: 'justice',
    nomNormalise: 'justice',
    nomOfficiel: 'Justice',
    annee: 2025,
    montantTotal: 10_000_000_000,
  },
];

const recettesMock: Recette[] = [
  { annee: 2025, type: 'IR', montantBrut: 90_000_000_000, montantNet: 90_000_000_000 },
  { annee: 2025, type: 'TVA', montantBrut: 100_000_000_000, montantNet: 100_000_000_000 },
  { annee: 2025, type: 'IS', montantBrut: 40_000_000_000, montantNet: 40_000_000_000 },
  { annee: 2025, type: 'TICPE', montantBrut: 15_000_000_000, montantNet: 15_000_000_000 },
  { annee: 2025, type: 'AUTRES', montantBrut: 205_000_000_000, montantNet: 205_000_000_000 },
];

vi.mock('../hooks/useAnnees', () => ({ useAnnees: vi.fn() }));
vi.mock('../hooks/useBudgetAnnee', () => ({ useBudgetAnnee: vi.fn() }));
vi.mock('../hooks/useMissions', () => ({ useMissions: vi.fn() }));
vi.mock('../hooks/useRecettes', () => ({ useRecettes: vi.fn() }));

const mockedUseAnnees = vi.mocked(useAnnees);
const mockedUseBudgetAnnee = vi.mocked(useBudgetAnnee);
const mockedUseMissions = vi.mocked(useMissions);
const mockedUseRecettes = vi.mocked(useRecettes);

// eslint-disable-next-line import/first
import Simulateur from './Simulateur';

function configurerMocksParDefaut() {
  mockedUseAnnees.mockReturnValue({ data: anneesMock } as ReturnType<typeof useAnnees>);
  mockedUseBudgetAnnee.mockReturnValue({
    data: budgetMock,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useBudgetAnnee>);
  mockedUseMissions.mockReturnValue({
    data: missionsMock,
    isLoading: false,
  } as ReturnType<typeof useMissions>);
  mockedUseRecettes.mockReturnValue({
    data: recettesMock,
    isLoading: false,
  } as ReturnType<typeof useRecettes>);
}

describe('Simulateur', () => {
  it('affiche un message de chargement pendant la requête', () => {
    mockedUseAnnees.mockReturnValue({ data: undefined } as ReturnType<typeof useAnnees>);
    mockedUseBudgetAnnee.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useBudgetAnnee>);
    mockedUseMissions.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useMissions>);
    mockedUseRecettes.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useRecettes>);

    render(<Simulateur />);

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it("affiche le bandeau de neutralité et le déficit simulé identique à la référence quand aucun curseur n'est modifié", () => {
    configurerMocksParDefaut();

    render(<Simulateur />);

    expect(
      screen.getByText(/aucun effet économique dynamique/i, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText('150 Md€')).toBeInTheDocument(); // déficit simulé
  });

  it('déplacer un curseur de mission met à jour le déficit simulé en temps réel', () => {
    configurerMocksParDefaut();

    render(<Simulateur />);

    fireEvent.change(screen.getByLabelText('Défense'), { target: { value: '10' } }); // +10% de 60 Md€ = +6 Md€

    expect(screen.getByText('156 Md€')).toBeInTheDocument();
  });

  it('le mode avancé révèle les curseurs de recettes fiscales, absents en mode simple', () => {
    configurerMocksParDefaut();

    render(<Simulateur />);

    expect(screen.queryByLabelText('TVA')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mode avancé' }));

    expect(screen.getByLabelText('TVA')).toBeInTheDocument();
    expect(screen.getByLabelText('IR')).toBeInTheDocument();
    expect(screen.getByLabelText('IS')).toBeInTheDocument();
    expect(screen.getByLabelText('TICPE')).toBeInTheDocument();
    // AUTRES exclu : pas une recette fiscale au sens du CDC.
    expect(screen.queryByLabelText('AUTRES')).not.toBeInTheDocument();
  });

  it('réinitialiser remet tous les curseurs et le déficit simulé à leur valeur de référence', () => {
    configurerMocksParDefaut();

    render(<Simulateur />);
    fireEvent.change(screen.getByLabelText('Défense'), { target: { value: '10' } });
    expect(screen.getByText('156 Md€')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    expect(screen.getByText('150 Md€')).toBeInTheDocument();
    expect(screen.getByLabelText('Défense')).toHaveValue('0');
  });
});

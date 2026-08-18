import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useComparateur } from '../hooks/useComparateur';
import type { AnneeBudget, Comparateur as ComparateurData } from '../types/domain';

const anneesMock: AnneeBudget[] = [
  { annee: 2021, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2022, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2023, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2024, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
];

vi.mock('../hooks/useAnnees', () => ({
  useAnnees: vi.fn(() => ({ data: anneesMock })),
}));

vi.mock('../hooks/useComparateur', () => ({
  useComparateur: vi.fn(() => ({ data: undefined })),
}));

const mockedUseComparateur = vi.mocked(useComparateur);

// eslint-disable-next-line import/first
import Comparateur from './Comparateur';

// Sonde qui expose l'URL courante dans le DOM, pour vérifier que
// `setSearchParams` l'a bien mise à jour (on évite `createMemoryRouter` +
// `RouterProvider` : ce "data router" déclenche en environnement de test
// jsdom un chemin de navigation basé sur `fetch`/`AbortSignal` qui échoue
// sans rapport avec la fonctionnalité testée ici — `MemoryRouter` classique
// suffit pour `useSearchParams`).
function SondeUrl() {
  const location = useLocation();
  return <div data-testid="url-actuelle">{`${location.pathname}${location.search}`}</div>;
}

function renderAvecRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/comparer" element={<Comparateur />} />
      </Routes>
      <SondeUrl />
    </MemoryRouter>,
  );
}

describe('Comparateur — URLs paramétrées (CDC 6.2)', () => {
  it("pré-sélectionne les années passées dans l'URL au montage", () => {
    renderAvecRouter('/comparer?annee_a=2022&annee_b=2023');

    expect(screen.getByLabelText(/^Année A$/)).toHaveValue('2022');
    expect(screen.getByLabelText(/^Année B$/)).toHaveValue('2023');
  });

  it("sans paramètres dans l'URL, sélectionne les deux dernières années disponibles et les inscrit dans l'URL", () => {
    renderAvecRouter('/comparer');

    expect(screen.getByLabelText(/^Année A$/)).toHaveValue('2023');
    expect(screen.getByLabelText(/^Année B$/)).toHaveValue('2024');
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent(
      '/comparer?annee_a=2023&annee_b=2024',
    );
  });

  it("met à jour l'URL quand l'utilisateur change une année sélectionnée", () => {
    renderAvecRouter('/comparer?annee_a=2021&annee_b=2024');

    fireEvent.change(screen.getByLabelText(/^Année A$/), { target: { value: '2022' } });

    expect(screen.getByTestId('url-actuelle')).toHaveTextContent(
      '/comparer?annee_a=2022&annee_b=2024',
    );
    expect(screen.getByLabelText(/^Année A$/)).toHaveValue('2022');
  });

  it('une URL partagée restitue le même état après un nouveau montage (rechargement simulé)', () => {
    const premier = renderAvecRouter('/comparer?annee_a=2021&annee_b=2023');
    const urlPartagee = within(premier.container).getByTestId('url-actuelle').textContent ?? '';
    premier.unmount();

    renderAvecRouter(urlPartagee);

    expect(screen.getByLabelText(/^Année A$/)).toHaveValue('2021');
    expect(screen.getByLabelText(/^Année B$/)).toHaveValue('2023');
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent(urlPartagee);
  });
});

describe('Comparateur — affichage du résultat', () => {
  it('affiche les écarts, les tableaux missions/recettes et les exports quand la comparaison est chargée', () => {
    const comparateurMock: ComparateurData = {
      anneeA: {
        annee: 2022,
        depensesNettes: 100_000_000_000,
        recettesNettes: 90_000_000_000,
        deficit: -10_000_000_000,
        dettePib: 110,
        sourceUrl: 'https://example.org/2022',
      },
      anneeB: {
        annee: 2023,
        depensesNettes: 110_000_000_000,
        recettesNettes: 95_000_000_000,
        deficit: -15_000_000_000,
        dettePib: 111,
        sourceUrl: 'https://example.org/2023',
      },
      ecartDepenses: 10_000_000_000,
      ecartRecettes: 5_000_000_000,
      ecartDeficit: -5_000_000_000,
      missions: [
        {
          slug: 'defense',
          nom: 'Défense',
          montantA: 50_000_000_000,
          montantB: 55_000_000_000,
          deltaAbsolu: 5_000_000_000,
          deltaRelatifPct: 10,
        },
      ],
      recettes: [
        {
          type: 'TVA',
          montantA: 80_000_000_000,
          montantB: 85_000_000_000,
          deltaAbsolu: 5_000_000_000,
          deltaRelatifPct: 6.25,
        },
      ],
    };
    mockedUseComparateur.mockReturnValue({
      data: comparateurMock,
    } as ReturnType<typeof useComparateur>);

    render(
      <MemoryRouter initialEntries={['/comparer?annee_a=2022&annee_b=2023']}>
        <Routes>
          <Route path="/comparer" element={<Comparateur />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Écart de dépenses')).toBeInTheDocument();
    expect(screen.getByText('Écart de recettes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /missions — 2022 vs 2023/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Défense' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'TVA' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /exporter csv/i })).toHaveLength(2);
    expect(screen.getByRole('button', { name: /exporter png du comparatif/i })).toBeInTheDocument();
  });
});

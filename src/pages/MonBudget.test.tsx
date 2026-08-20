import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBudgetPerso } from '../hooks/useBudgetPerso';
import type { BudgetPerso } from '../types/domain';
import { formatEuros } from '../utils/format';

const budgetPersoMock: BudgetPerso = {
  revenuNetMensuel: 2000,
  anneeReference: 2023,
  irEstime: 1200,
  tvaEstimee: 800,
  contributionTotaleEstimee: 5000,
  repartition: [
    { missionSlug: 'defense', missionNom: 'Défense', montant: 3000 },
    { missionSlug: 'justice', missionNom: 'Justice', montant: 2000 },
  ],
  methodologie: {
    hypotheses: ['Le taux moyen d’IR est appliqué au revenu net déclaré.'],
    limites: ['Cette estimation ne prend pas en compte les niches fiscales.'],
    sources: [{ nom: 'DGFiP', url: 'https://dgfip.example.org' }],
  },
};

vi.mock('../hooks/useBudgetPerso', () => ({
  useBudgetPerso: vi.fn(),
}));

const mockedUseBudgetPerso = vi.mocked(useBudgetPerso);

// eslint-disable-next-line import/first
import MonBudget from './MonBudget';

// `formatEuros` insère des espaces insécables/fines (Intl fr-FR) que le
// normalizer par défaut de Testing Library convertit en espace normal avant
// comparaison : on construit donc une regex tolérante à tout espace plutôt
// que de comparer une chaîne exacte, pour ne pas dépendre du caractère précis.
const ESPACES = /[\s\u00a0\u202f]+/g;
function texteAvecEspacesFlexibles(valeur: string): RegExp {
  const echappe = valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(echappe.replace(ESPACES, '.+'));
}

function SondeUrl() {
  const location = useLocation();
  return <div data-testid="url-actuelle">{`${location.pathname}${location.search}`}</div>;
}

function renderMonBudget(initialPath = '/mon-budget') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/mon-budget" element={<MonBudget />} />
      </Routes>
      <SondeUrl />
    </MemoryRouter>,
  );
}

describe('MonBudget', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("n'affiche aucun résultat avant soumission du formulaire", () => {
    mockedUseBudgetPerso.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useBudgetPerso>);

    renderMonBudget();

    expect(screen.queryByText(/contribution totale estimée/i)).not.toBeInTheDocument();
  });

  it('affiche un état de chargement pendant le calcul', () => {
    mockedUseBudgetPerso.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useBudgetPerso>);

    renderMonBudget();

    expect(screen.getByText(/calcul en cours/i)).toBeInTheDocument();
  });

  it("affiche un message d'erreur si le calcul échoue", () => {
    mockedUseBudgetPerso.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useBudgetPerso>);

    renderMonBudget();

    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });

  it("affiche le résultat et l'URL partageable dès l'arrivée sur la page (dont la méthodologie)", () => {
    mockedUseBudgetPerso.mockImplementation(
      (revenuNet) =>
        ({
          data: revenuNet === undefined ? undefined : budgetPersoMock,
          isLoading: false,
          isError: false,
        }) as ReturnType<typeof useBudgetPerso>,
    );

    renderMonBudget();

    // Le revenu par défaut (2000 €) est calculé sans action de l'utilisateur,
    // et l'URL le reflète immédiatement pour rester partageable.
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/mon-budget?revenu_net=2000');

    expect(
      screen.getByText(texteAvecEspacesFlexibles(`${formatEuros(budgetPersoMock.irEstime)} / an`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        texteAvecEspacesFlexibles(
          `${formatEuros(budgetPersoMock.contributionTotaleEstimee)} / an`,
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/contribution totale estimée/i)).toBeInTheDocument();
    expect(screen.getByText('Défense')).toBeInTheDocument();
    expect(screen.getByText('Justice')).toBeInTheDocument();

    // Méthodologie affichée avec le résultat.
    expect(screen.getByRole('heading', { name: 'Méthodologie' })).toBeInTheDocument();
    expect(
      screen.getByText('Le taux moyen d’IR est appliqué au revenu net déclaré.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cette estimation ne prend pas en compte les niches fiscales.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'DGFiP' })).toHaveAttribute(
      'href',
      'https://dgfip.example.org',
    );
  });

  it('recalcule au fil de la saisie, sans bouton à cliquer', () => {
    vi.useFakeTimers();
    mockedUseBudgetPerso.mockImplementation(
      (revenuNet) =>
        ({
          data: revenuNet === undefined ? undefined : { ...budgetPersoMock, revenuNetMensuel: revenuNet },
          isLoading: false,
          isError: false,
        }) as ReturnType<typeof useBudgetPerso>,
    );

    renderMonBudget();

    // Aucun bouton « Calculer » : le champ pilote directement le calcul.
    expect(screen.queryByRole('button', { name: /calculer/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/revenu net mensuel/i), { target: { value: '3500' } });

    // Avant expiration du délai anti-rebond, l'URL porte encore l'ancien revenu.
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('revenu_net=2000');

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('revenu_net=3500');
  });

  it("pré-remplit et déclenche le calcul depuis l'URL (?revenu_net=)", () => {
    mockedUseBudgetPerso.mockImplementation(
      (revenuNet) =>
        ({
          data: revenuNet === 2500 ? budgetPersoMock : undefined,
          isLoading: false,
          isError: false,
        }) as ReturnType<typeof useBudgetPerso>,
    );

    renderMonBudget('/mon-budget?revenu_net=2500');

    expect(screen.getByLabelText(/revenu net mensuel/i)).toHaveValue(2500);
    expect(screen.getByText(/contribution totale estimée/i)).toBeInTheDocument();
  });
});

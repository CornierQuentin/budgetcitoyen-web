import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFiltersStore } from '../store/useFiltersStore';
import type { AnneeBudget, AnneeBudgetDetail, Mission, Recette } from '../types/domain';

const anneesMock: AnneeBudget[] = [
  { annee: 2022, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
  { annee: 2023, depensesNettes: 0, recettesNettes: 0, deficit: 0 },
];

const missionsMock: Mission[] = [
  {
    id: 1,
    slug: 'defense',
    nomNormalise: 'defense',
    nomOfficiel: 'Défense',
    annee: 2023,
    montantTotal: 50_000_000_000,
  },
  {
    id: 2,
    slug: 'justice',
    nomNormalise: 'justice',
    nomOfficiel: 'Justice',
    annee: 2023,
    montantTotal: 10_000_000_000,
  },
];

const recettesMock: Recette[] = [
  { annee: 2023, type: 'TVA', montantBrut: 200, montantNet: 190 },
  { annee: 2023, type: 'IR', montantBrut: 100, montantNet: 95 },
];

const budgetAnneeMock: AnneeBudgetDetail = {
  annee: 2023,
  depensesNettes: 60_000_000_000,
  recettesNettes: 190,
  // `deficit` est une magnitude POSITIVE côté API (le solde budgétaire en est
  // l'opposé) : le jeu d'essai doit respecter cette convention, sous peine de
  // valider un affichage inversé.
  deficit: 1_000_000_000,
  dettePib: 111,
  sourceUrl: 'https://example.org/budget-2023',
};

vi.mock('../hooks/useAnnees', () => ({
  useAnnees: vi.fn(() => ({ data: anneesMock })),
}));

vi.mock('../hooks/useMissions', () => ({
  useMissions: vi.fn(() => ({ data: missionsMock })),
}));

vi.mock('../hooks/useRecettes', () => ({
  useRecettes: vi.fn(() => ({ data: recettesMock })),
}));

vi.mock('../hooks/useBudgetAnnee', () => ({
  useBudgetAnnee: vi.fn(() => ({ data: budgetAnneeMock })),
}));

// eslint-disable-next-line import/first
import Dashboard from './Dashboard';

function SondeUrl() {
  const location = useLocation();
  return <div data-testid="url-actuelle">{`${location.pathname}${location.search}`}</div>;
}

function renderDashboard(initialPath = '/tableau-de-bord') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/tableau-de-bord/mission/:slug" element={<div>Page mission</div>} />
      </Routes>
      <SondeUrl />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  // jsdom ne calcule pas de vraie mise en page : sans cette simulation, le
  // ResponsiveContainer de recharts refuse de rendre ses enfants (même pattern
  // que DonutChart.test.tsx).
  beforeEach(() => {
    useFiltersStore.setState({ anneeActive: new Date().getFullYear() });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("affiche le titre de l'exercice et se recale sur la dernière année disponible", () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /exercice 2023/i })).toBeInTheDocument();
    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/tableau-de-bord?annee=2023');
  });

  it('affiche les trois chiffres clés avec leur écart sur l’année précédente', () => {
    renderDashboard();

    expect(screen.getByText('Dépenses totales')).toBeInTheDocument();
    expect(screen.getByText('Recettes totales')).toBeInTheDocument();
    expect(screen.getByText('Solde budgétaire')).toBeInTheDocument();
    // Déficit négatif dans le jeu d'essai : l'état est nommé, pas seulement
    // suggéré par une couleur.
    expect(screen.getByText('Déficit')).toBeInTheDocument();
    expect(screen.getAllByText(/vs 2022/).length).toBeGreaterThan(0);
  });

  it('liste toutes les missions dans un tableau, triées par montant décroissant', () => {
    renderDashboard();

    const lignes = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(lignes).toHaveLength(missionsMock.length);

    expect(lignes[0]).toHaveTextContent('Défense');
    expect(lignes[0]).toHaveTextContent('50 Md€');
    expect(lignes[1]).toHaveTextContent('Justice');
    expect(lignes[1]).toHaveTextContent('10 Md€');
  });

  it('inverse le tri des missions au clic sur l’en-tête Montant', () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: /montant/i }));

    const lignes = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(lignes[0]).toHaveTextContent('Justice');
    expect(lignes[1]).toHaveTextContent('Défense');
  });

  it('navigue vers la page de la mission cliquée dans le tableau', () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Défense' }));

    expect(screen.getByText('Page mission')).toBeInTheDocument();
  });

  it('ouvre la mission au clic sur toute la ligne, pas seulement sur son nom', () => {
    renderDashboard();

    const ligne = within(screen.getByRole('table')).getAllByRole('row')[1];
    // Le montant, pas le lien : c'est précisément ce que le clic sur le nom
    // seul ne couvrait pas.
    fireEvent.click(within(ligne).getByText('50 Md€'));

    expect(screen.getByText('Page mission')).toBeInTheDocument();
  });

  it('ne navigue pas quand le clic conclut une sélection de texte', () => {
    renderDashboard();

    const selection = { toString: () => '50 Md€' } as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(selection);

    const ligne = within(screen.getByRole('table')).getAllByRole('row')[1];
    fireEvent.click(within(ligne).getByText('50 Md€'));

    expect(screen.queryByText('Page mission')).not.toBeInTheDocument();
  });

  it('met à jour l’année sélectionnée (et l’URL) quand l’utilisateur change le sélecteur', () => {
    renderDashboard();

    fireEvent.change(screen.getByLabelText(/^Année$/), { target: { value: '2022' } });

    expect(screen.getByTestId('url-actuelle')).toHaveTextContent('/tableau-de-bord?annee=2022');
  });

  it('propose un export CSV des missions affichées', () => {
    renderDashboard();

    expect(screen.getAllByRole('button', { name: /exporter csv/i }).length).toBeGreaterThan(0);
  });

  it('affiche le camembert des missions à la demande, et navigue au clic sur une tranche', () => {
    const { container } = renderDashboard();

    // Masqué par défaut : le tableau dense est devenu la lecture principale.
    expect(container.querySelector('#camembert-missions')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Voir en camembert' }));

    expect(container.querySelector('#camembert-missions')).toBeInTheDocument();

    // Le camembert a désormais la forme compacte des maquettes, comme tous
    // les autres du site : c'est la légende qui porte le clic, pas un secteur
    // recharts.
    const camembert = container.querySelector('#camembert-missions') as HTMLElement;
    fireEvent.click(within(camembert).getByRole('button', { name: /Défense/ }));

    expect(screen.getByText('Page mission')).toBeInTheDocument();
  });

  it('réconcilie le total du camembert des recettes avec le chiffre clé', () => {
    // Le camembert somme les recettes par type (190 + 95) tandis que le
    // chiffre clé « Recettes totales » vaut 190 : celui-ci est le total du
    // tableau d'équilibre officiel, qui retranche les prélèvements reversés
    // et intègre le retraitement des remboursements d'impôts. Deux chiffres
    // qui ne tombent pas juste doivent être expliqués, jamais laissés à la
    // charge du lecteur.
    renderDashboard();

    expect(screen.getByText(/détaille .* de recettes par impôt/i)).toBeInTheDocument();
    expect(screen.getByText(/tableau d'équilibre officiel/i)).toBeInTheDocument();
  });

  it('affiche un rappel des sigles de recettes (IR, TVA, IS, TICPE, AUTRES)', () => {
    renderDashboard();

    expect(screen.getAllByText('IR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TVA').length).toBeGreaterThan(0);
    expect(screen.getByText('IS')).toBeInTheDocument();
    expect(screen.getByText('TICPE')).toBeInTheDocument();
    expect(screen.getByText('AUTRES')).toBeInTheDocument();
  });
});

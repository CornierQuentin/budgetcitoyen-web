import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMarches, useMarchesBornes, useMarchesRepartitionCpv } from '../hooks/useMarches';
import type { MarchePublic, MarchesBornes, MarchesCpvRepartitionItem, MarchesPage } from '../types/domain';

function creerMarche(overrides: Partial<MarchePublic> = {}): MarchePublic {
  return {
    id: 1,
    marcheIdSource: 'ABC123',
    nature: 'Marché',
    objet: "Travaux de rénovation d'une école",
    codecpv: '45000000-7',
    codecpvDivision: '45',
    procedure: "Appel d'offres ouvert",
    acheteurSiret: '12345678900011',
    titulaireSiret: '98765432100022',
    titulaireIdType: 'SIRET',
    dureemois: 12,
    datenotification: '2024-06-15',
    datepublicationdonnees: null,
    montant: 500000,
    formeprix: null,
    offresrecues: 3,
    marcheinnovant: false,
    ...overrides,
  };
}

function creerPage(items: MarchePublic[], overrides: Partial<MarchesPage> = {}): MarchesPage {
  return { items, total: items.length, page: 1, pageSize: 20, totalPages: 1, ...overrides };
}

const repartitionMock: MarchesCpvRepartitionItem[] = [
  { cpvDivision: '45', label: 'Travaux de construction', montantTotal: 500000, nombre: 1 },
  { cpvDivision: '30', label: 'Machines de bureau et de calcul', montantTotal: 25000, nombre: 1 },
];

const bornesMock: MarchesBornes = {
  dateMin: '2010-06-02',
  dateMax: '2026-08-17',
  montantMin: 1,
  montantMax: 3_000_000_000,
};

vi.mock('../hooks/useMarches', () => ({
  useMarches: vi.fn(() => ({ data: undefined, isFetching: false })),
  useMarchesRepartitionCpv: vi.fn(() => ({ data: undefined })),
  useMarchesBornes: vi.fn(() => ({ data: undefined })),
}));

const mockedUseMarches = vi.mocked(useMarches);
const mockedUseMarchesRepartitionCpv = vi.mocked(useMarchesRepartitionCpv);
const mockedUseMarchesBornes = vi.mocked(useMarchesBornes);

// eslint-disable-next-line import/first
import Marches from './Marches';

function renderPage(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Marches />
    </MemoryRouter>,
  );
}

describe('Marches', () => {
  // jsdom ne calcule pas de vraie mise en page : ResponsiveContainer de
  // recharts refuse de rendre ses enfants sans cette simulation (même
  // pattern que Dashboard.test.tsx/DonutChart.test.tsx).
  beforeEach(() => {
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

    mockedUseMarchesBornes.mockReturnValue({
      data: bornesMock,
    } as ReturnType<typeof useMarchesBornes>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche le bandeau de source, la plage de dates et le total', () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([creerMarche()]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);
    mockedUseMarchesRepartitionCpv.mockReturnValue({
      data: repartitionMock,
    } as ReturnType<typeof useMarchesRepartitionCpv>);

    renderPage();

    expect(screen.getByText(/02\/06\/2010 à 17\/08\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Liste des marchés (1)')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /rénovation d'une école/i })).toBeInTheDocument();
  });

  it('affiche un lien SIRET vers l’annuaire public pour un titulaire de type SIRET', () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([creerMarche()]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);
    mockedUseMarchesRepartitionCpv.mockReturnValue({
      data: repartitionMock,
    } as ReturnType<typeof useMarchesRepartitionCpv>);

    renderPage();

    const lien = screen.getByRole('link', { name: '98765432100022' });
    expect(lien).toHaveAttribute(
      'href',
      'https://annuaire-entreprises.data.gouv.fr/etablissement/98765432100022',
    );
  });

  it("n'affiche pas de lien pour un identifiant titulaire non-SIRET", () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([creerMarche({ titulaireIdType: 'TVA', titulaireSiret: 'FR59000017896' })]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);
    mockedUseMarchesRepartitionCpv.mockReturnValue({
      data: repartitionMock,
    } as ReturnType<typeof useMarchesRepartitionCpv>);

    renderPage();

    expect(screen.getByText('FR59000017896')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'FR59000017896' })).not.toBeInTheDocument();
  });

  it("affiche un message neutre quand la base est vide (aucun filtre actif)", () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);

    renderPage();

    expect(screen.getByText('Aucun marché disponible.')).toBeInTheDocument();
  });

  it('propose de réinitialiser les filtres quand ils excluent tous les résultats', () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);

    renderPage(['/?q=introuvable']);

    expect(screen.getByText(/aucun marché ne correspond aux filtres actuels/i)).toBeInTheDocument();

    const boutonReset = within(screen.getByRole('table')).getByRole('button', {
      name: /réinitialiser les filtres/i,
    });
    fireEvent.click(boutonReset);

    expect(screen.getByLabelText(/rechercher \(objet\)/i)).toHaveValue('');
  });

  it('affiche le camembert des catégories CPV et filtre au clic sur une tranche', () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([creerMarche()]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);
    mockedUseMarchesRepartitionCpv.mockReturnValue({
      data: repartitionMock,
    } as ReturnType<typeof useMarchesRepartitionCpv>);

    const { container } = renderPage();

    const secteurs = container.querySelectorAll('.recharts-pie-sector path');
    expect(secteurs.length).toBeGreaterThan(0);

    fireEvent.click(secteurs[0]);

    expect(screen.getByRole('button', { name: /retirer le filtre catégorie/i })).toBeInTheDocument();
  });

  it('propose un export CSV de la page courante', () => {
    mockedUseMarches.mockReturnValue({
      data: creerPage([creerMarche()]),
      isFetching: false,
    } as ReturnType<typeof useMarches>);
    mockedUseMarchesRepartitionCpv.mockReturnValue({
      data: repartitionMock,
    } as ReturnType<typeof useMarchesRepartitionCpv>);

    renderPage();

    expect(screen.getByRole('button', { name: /exporter cette page/i })).toBeInTheDocument();
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { ComparateurResponseDto } from '../types/api';
import type { Comparateur } from '../types/domain';
import { useComparateur } from './useComparateur';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

const anneeFixture = {
  annee: 2022,
  depenses_nettes: 100,
  recettes_nettes: 90,
  deficit: -10,
  dette_pib: 110,
  source_url: 'https://example.org/2022',
};

describe('useComparateur', () => {
  it('appelle GET /comparateur avec annee_a et annee_b, et mappe la réponse en camelCase', async () => {
    const fixture: ComparateurResponseDto = {
      annee_a: anneeFixture,
      annee_b: { ...anneeFixture, annee: 2023, source_url: 'https://example.org/2023' },
      ecart_depenses: 10,
      ecart_recettes: 5,
      ecart_deficit: 5,
      missions: [
        {
          slug: 'defense',
          nom: 'Défense',
          montant_a: 50,
          montant_b: 55,
          delta_absolu: 5,
          delta_relatif_pct: 10,
        },
      ],
      recettes: [
        { type: 'TVA', montant_a: 80, montant_b: 85, delta_absolu: 5, delta_relatif_pct: 6.25 },
      ],
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useComparateur(2022, 2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/comparateur', {
      params: { annee_a: 2022, annee_b: 2023 },
    });

    const expected: Comparateur = {
      anneeA: {
        annee: 2022,
        depensesNettes: 100,
        recettesNettes: 90,
        deficit: -10,
        dettePib: 110,
        sourceUrl: 'https://example.org/2022',
      },
      anneeB: {
        annee: 2023,
        depensesNettes: 100,
        recettesNettes: 90,
        deficit: -10,
        dettePib: 110,
        sourceUrl: 'https://example.org/2023',
      },
      ecartDepenses: 10,
      ecartRecettes: 5,
      ecartDeficit: 5,
      missions: [
        {
          slug: 'defense',
          nom: 'Défense',
          montantA: 50,
          montantB: 55,
          deltaAbsolu: 5,
          deltaRelatifPct: 10,
        },
      ],
      recettes: [
        { type: 'TVA', montantA: 80, montantB: 85, deltaAbsolu: 5, deltaRelatifPct: 6.25 },
      ],
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant que les deux années ne sont pas fournies", () => {
    renderHook(() => useComparateur(2022, undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { IndicateurMacroResponseDto } from '../types/api';
import type { IndicateurMacro } from '../types/domain';
import { useIndicateur } from './useIndicateur';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useIndicateur', () => {
  it('appelle GET /indicateurs/{annee} et mappe la réponse en camelCase', async () => {
    const fixture: IndicateurMacroResponseDto = {
      annee: 2023,
      pib_courant: 2_800_000_000_000,
      population: 68_000_000,
      source_pib_url: 'https://insee.example.org/pib',
      source_population_url: 'https://insee.example.org/population',
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useIndicateur(2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/indicateurs/2023');

    const expected: IndicateurMacro = {
      annee: 2023,
      pibCourant: 2_800_000_000_000,
      population: 68_000_000,
      sourcePibUrl: 'https://insee.example.org/pib',
      sourcePopulationUrl: 'https://insee.example.org/population',
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant que l'année est undefined", () => {
    renderHook(() => useIndicateur(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

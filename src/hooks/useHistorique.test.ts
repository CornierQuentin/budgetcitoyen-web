import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { AnneeBudgetListItemDto } from '../types/api';
import type { AnneeBudget } from '../types/domain';
import { useHistorique } from './useHistorique';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useHistorique', () => {
  it('appelle GET /budget/historique avec les bornes de et a, et mappe la réponse en camelCase', async () => {
    const fixture: AnneeBudgetListItemDto[] = [
      { annee: 2020, depenses_nettes: 80, recettes_nettes: 70, deficit: -10 },
      { annee: 2021, depenses_nettes: 90, recettes_nettes: 75, deficit: -15 },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useHistorique(2020, 2021), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/budget/historique', {
      params: { de: 2020, a: 2021 },
    });

    const expected: AnneeBudget[] = [
      { annee: 2020, depensesNettes: 80, recettesNettes: 70, deficit: -10 },
      { annee: 2021, depensesNettes: 90, recettesNettes: 75, deficit: -15 },
    ];
    expect(result.current.data).toEqual(expected);
  });

  it('appelle GET /budget/historique sans bornes quand elles sont omises', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useHistorique(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/budget/historique', {
      params: { de: undefined, a: undefined },
    });
  });
});

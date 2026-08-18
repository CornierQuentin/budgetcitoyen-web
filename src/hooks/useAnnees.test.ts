import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { AnneeBudgetListItemDto } from '../types/api';
import type { AnneeBudget } from '../types/domain';
import { useAnnees } from './useAnnees';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useAnnees', () => {
  it('appelle GET /budget/annees et retourne la liste mappée en camelCase', async () => {
    const fixture: AnneeBudgetListItemDto[] = [
      { annee: 2023, depenses_nettes: 100, recettes_nettes: 90, deficit: -10 },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useAnnees(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/budget/annees');

    const expected: AnneeBudget[] = [
      { annee: 2023, depensesNettes: 100, recettesNettes: 90, deficit: -10 },
    ];
    expect(result.current.data).toEqual(expected);
  });
});

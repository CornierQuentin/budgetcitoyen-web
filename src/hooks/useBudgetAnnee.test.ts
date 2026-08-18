import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { AnneeBudgetResponseDto } from '../types/api';
import type { AnneeBudgetDetail } from '../types/domain';
import { useBudgetAnnee } from './useBudgetAnnee';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useBudgetAnnee', () => {
  it('appelle GET /budget/{annee} et retourne le détail mappé en camelCase', async () => {
    const fixture: AnneeBudgetResponseDto = {
      annee: 2023,
      depenses_nettes: 100,
      recettes_nettes: 90,
      deficit: -10,
      dette_pib: 111.5,
      source_url: 'https://www.data.gouv.fr/budget-2023',
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useBudgetAnnee(2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/budget/2023');

    const expected: AnneeBudgetDetail = {
      annee: 2023,
      depensesNettes: 100,
      recettesNettes: 90,
      deficit: -10,
      dettePib: 111.5,
      sourceUrl: 'https://www.data.gouv.fr/budget-2023',
    };
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant que l'année est undefined", () => {
    renderHook(() => useBudgetAnnee(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { RecetteResponseDto } from '../types/api';
import type { Recette } from '../types/domain';
import { useRecettesHistorique } from './useRecettesHistorique';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useRecettesHistorique', () => {
  it('appelle GET /recettes/historique avec de, a et type, et mappe la réponse en camelCase', async () => {
    const fixture: RecetteResponseDto[] = [
      { annee: 2023, type: 'TVA', montant_brut: 200, montant_net: 180 },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useRecettesHistorique(2020, 2023, 'TVA'), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/recettes/historique', {
      params: { de: 2020, a: 2023, type: 'TVA' },
    });

    const expected: Recette[] = [{ annee: 2023, type: 'TVA', montantBrut: 200, montantNet: 180 }];
    expect(result.current.data).toEqual(expected);
  });

  it('appelle GET /recettes/historique sans filtre de type quand il est omis', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useRecettesHistorique(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/recettes/historique', {
      params: { de: undefined, a: undefined, type: undefined },
    });
  });
});

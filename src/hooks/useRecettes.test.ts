import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { RecetteResponseDto } from '../types/api';
import type { Recette } from '../types/domain';
import { useRecettes } from './useRecettes';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useRecettes', () => {
  it('appelle GET /recettes/{annee} et mappe la réponse en camelCase', async () => {
    const fixture: RecetteResponseDto[] = [
      { annee: 2023, type: 'TVA', montant_brut: 200, montant_net: 180 },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useRecettes(2023), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/recettes/2023');

    const expected: Recette[] = [{ annee: 2023, type: 'TVA', montantBrut: 200, montantNet: 180 }];
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant que l'année est undefined", () => {
    renderHook(() => useRecettes(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

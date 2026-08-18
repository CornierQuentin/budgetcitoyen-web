import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { MissionResponseDto } from '../types/api';
import type { Mission } from '../types/domain';
import { useMissions } from './useMissions';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useMissions', () => {
  it('appelle GET /missions avec le paramètre annee et mappe la réponse en camelCase', async () => {
    const fixture: MissionResponseDto[] = [
      {
        id: 1,
        slug: 'defense',
        nom_normalise: 'defense',
        nom_officiel: 'Défense',
        annee: 2023,
        montant_total: 50_000_000_000,
      },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useMissions(2023), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/missions', { params: { annee: 2023 } });

    const expected: Mission[] = [
      {
        id: 1,
        slug: 'defense',
        nomNormalise: 'defense',
        nomOfficiel: 'Défense',
        annee: 2023,
        montantTotal: 50_000_000_000,
      },
    ];
    expect(result.current.data).toEqual(expected);
  });

  it('appelle GET /missions sans filtre quand aucune année n’est fournie', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useMissions(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/missions', { params: { annee: undefined } });
  });
});

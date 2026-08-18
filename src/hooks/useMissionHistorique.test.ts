import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { MissionHistoriqueItemDto } from '../types/api';
import type { MissionHistoriqueItem } from '../types/domain';
import { useMissionHistorique } from './useMissionHistorique';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useMissionHistorique', () => {
  it('appelle GET /missions/{slug}/historique avec de et a, et mappe la réponse en camelCase', async () => {
    const fixture: MissionHistoriqueItemDto[] = [
      { annee: 2020, nom_officiel: 'Défense (ancien libellé)' },
      { annee: 2023, nom_officiel: 'Défense' },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useMissionHistorique('defense', 2020, 2023), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/missions/defense/historique', {
      params: { de: 2020, a: 2023 },
    });

    const expected: MissionHistoriqueItem[] = [
      { annee: 2020, nomOfficiel: 'Défense (ancien libellé)' },
      { annee: 2023, nomOfficiel: 'Défense' },
    ];
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant qu'aucun slug n'est fourni", () => {
    renderHook(() => useMissionHistorique(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

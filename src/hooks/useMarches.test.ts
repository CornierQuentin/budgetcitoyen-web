import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type {
  MarchePublicResponseDto,
  MarchesBornesResponseDto,
  MarchesCpvRepartitionItemDto,
} from '../types/api';
import { useMarches, useMarchesBornes, useMarchesRepartitionCpv } from './useMarches';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useMarches', () => {
  it('appelle GET /marches avec les filtres et la pagination en snake_case', async () => {
    const marche: MarchePublicResponseDto = {
      id: 1,
      marche_id_source: 'ABC',
      nature: 'Marché',
      objet: 'Objet',
      codecpv: '45000000-7',
      codecpv_division: '45',
      procedure: null,
      acheteur_siret: '12345678900011',
      titulaire_siret: '98765432100022',
      titulaire_id_type: 'SIRET',
      dureemois: null,
      datenotification: '2024-01-01',
      datepublicationdonnees: null,
      montant: 1000,
      formeprix: null,
      offresrecues: null,
      marcheinnovant: null,
    };
    const fixture = { items: [marche], total: 1, page: 1, page_size: 20, total_pages: 1 };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(
      () => useMarches({ page: 1, pageSize: 20, q: 'hopital', dateDebut: '2024-01-01' }),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/marches', {
      params: {
        q: 'hopital',
        date_debut: '2024-01-01',
        date_fin: undefined,
        montant_min: undefined,
        montant_max: undefined,
        cpv_division: undefined,
        page: 1,
        page_size: 20,
      },
    });
    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.items[0].marcheIdSource).toBe('ABC');
  });
});

describe('useMarchesRepartitionCpv', () => {
  it('appelle GET /marches/repartition-cpv avec les filtres', async () => {
    const fixture: MarchesCpvRepartitionItemDto[] = [
      { cpv_division: '45', label: 'Travaux de construction', montant_total: 5000, nombre: 2 },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useMarchesRepartitionCpv({ cpvDivision: '45' }), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/marches/repartition-cpv', {
      params: {
        q: undefined,
        date_debut: undefined,
        date_fin: undefined,
        montant_min: undefined,
        montant_max: undefined,
        cpv_division: '45',
      },
    });
    expect(result.current.data?.[0].montantTotal).toBe(5000);
  });
});

describe('useMarchesBornes', () => {
  it('appelle GET /marches/bornes', async () => {
    const fixture: MarchesBornesResponseDto = {
      date_min: '2010-06-02',
      date_max: '2026-08-17',
      montant_min: 1,
      montant_max: 3_000_000_000,
    };
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useMarchesBornes(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/marches/bornes');
    expect(result.current.data?.dateMin).toBe('2010-06-02');
  });
});

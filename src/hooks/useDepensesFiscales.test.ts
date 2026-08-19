import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '../services/apiClient';
import { camelizeKeys } from '../services/mappers';
import { createQueryClientWrapper } from '../testUtils/queryClientWrapper';
import type { DepenseFiscaleResponseDto } from '../types/api';
import type { DepenseFiscale } from '../types/domain';
import { useDepensesFiscales, useDepensesFiscalesAnnees } from './useDepensesFiscales';

vi.mock('../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('useDepensesFiscales', () => {
  it('appelle GET /depenses-fiscales/{annee} et mappe la réponse en camelCase', async () => {
    const fixture: DepenseFiscaleResponseDto[] = [
      {
        annee: 2021,
        numero: '40107',
        categorie: 'Impôts locaux',
        sous_categorie: 'Sous-categorie',
        sous_sous_categorie: null,
        libelle: 'Mesure',
        beneficiaire: 'Entreprises',
        montant_millions: 1.0,
        statut_montant: 'chiffre',
        methode_chiffrage: 'Simulation',
      },
    ];
    mockedGet.mockResolvedValueOnce({ data: camelizeKeys(fixture) });

    const { result } = renderHook(() => useDepensesFiscales(2021), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/depenses-fiscales/2021');

    const expected: DepenseFiscale[] = [
      {
        annee: 2021,
        numero: '40107',
        categorie: 'Impôts locaux',
        sousCategorie: 'Sous-categorie',
        sousSousCategorie: null,
        libelle: 'Mesure',
        beneficiaire: 'Entreprises',
        montantMillions: 1.0,
        statutMontant: 'chiffre',
        methodeChiffrage: 'Simulation',
      },
    ];
    expect(result.current.data).toEqual(expected);
  });

  it("n'appelle pas l'API tant que l'année est undefined", () => {
    renderHook(() => useDepensesFiscales(undefined), { wrapper: createQueryClientWrapper() });

    expect(mockedGet).not.toHaveBeenCalled();
  });
});

describe('useDepensesFiscalesAnnees', () => {
  it('appelle GET /depenses-fiscales/annees et retourne la liste', async () => {
    mockedGet.mockResolvedValueOnce({ data: [2021] });

    const { result } = renderHook(() => useDepensesFiscalesAnnees(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedGet).toHaveBeenCalledWith('/depenses-fiscales/annees');
    expect(result.current.data).toEqual([2021]);
  });
});

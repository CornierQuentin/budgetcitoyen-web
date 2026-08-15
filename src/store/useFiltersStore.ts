import { create } from 'zustand';

interface FiltersState {
  anneeActive: number;
  setAnneeActive: (annee: number) => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  anneeActive: new Date().getFullYear(),
  setAnneeActive: (annee: number) => set({ anneeActive: annee }),
}));

// Types du domaine budgétaire, exprimés en camelCase côté frontend.
// L'API backend renvoie du snake_case : le mapping snake_case -> camelCase
// est à implémenter en Phase 1 (couche services/hooks).

export interface AnneeBudget {
  annee: number;
  totalDepenses: number;
  totalRecettes: number;
  solde: number;
  missions: Mission[];
}

export interface Mission {
  id: string;
  slug: string;
  nom: string;
  totalDepenses: number;
  programmes: Programme[];
}

export interface Programme {
  id: string;
  nom: string;
  totalDepenses: number;
  actions: Action[];
}

export interface Action {
  id: string;
  nom: string;
  montant: number;
}

export interface Depense {
  id: string;
  annee: number;
  missionId: string;
  programmeId: string;
  actionId: string;
  montant: number;
}

export interface Recette {
  id: string;
  annee: number;
  categorie: string;
  montant: number;
}

export interface MissionAlias {
  slug: string;
  anciensNoms: string[];
}

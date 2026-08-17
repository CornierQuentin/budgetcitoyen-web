// Types du domaine budgétaire, exprimés en camelCase côté frontend.
// Ce sont les types que consomment les composants ; ils correspondent aux
// Dto de src/types/api.ts après passage par le mapper camelizeKeys
// (src/services/mappers.ts), branché en interceptor de réponse Axios.

export type TypeRecette = 'IR' | 'TVA' | 'IS' | 'TICPE' | 'AUTRES';

export interface AnneeBudget {
  annee: number;
  depensesNettes: number;
  recettesNettes: number;
  deficit: number;
}

export interface AnneeBudgetDetail extends AnneeBudget {
  dettePib: number | null;
  sourceUrl: string;
}

export interface Recette {
  annee: number;
  type: TypeRecette;
  montantBrut: number;
  montantNet: number;
}

export interface Mission {
  id: number;
  slug: string;
  nomNormalise: string;
  nomOfficiel: string;
  annee: number;
  montantTotal: number;
}

export interface MissionHistoriqueItem {
  annee: number;
  nomOfficiel: string;
}

export interface ActionDetail {
  id: number;
  code: string;
  nom: string;
  ae: number;
  cp: number;
}

export interface ProgrammeDetail {
  id: number;
  code: string;
  nom: string;
  montantTotal: number;
  actions: ActionDetail[];
}

export interface MissionDetail {
  id: number;
  slug: string;
  nomOfficiel: string;
  annee: number;
  montantTotal: number;
  programmes: ProgrammeDetail[];
}

export interface Programme {
  id: number;
  missionId: number;
  code: string;
  nom: string;
  annee: number;
}

export interface MissionDelta {
  slug: string;
  nom: string;
  montantA: number;
  montantB: number;
  deltaAbsolu: number;
  deltaRelatifPct: number | null;
}

export interface RecetteDelta {
  type: TypeRecette;
  montantA: number | null;
  montantB: number | null;
  deltaAbsolu: number | null;
  deltaRelatifPct: number | null;
}

export interface Comparateur {
  anneeA: AnneeBudgetDetail;
  anneeB: AnneeBudgetDetail;
  ecartDepenses: number;
  ecartRecettes: number;
  ecartDeficit: number;
  missions: MissionDelta[];
  recettes: RecetteDelta[];
}

export interface Source {
  nom: string;
  url: string;
}

export interface Methodologie {
  hypotheses: string[];
  limites: string[];
  sources: Source[];
}

export interface RepartitionItem {
  missionSlug: string;
  missionNom: string;
  montant: number;
}

export interface BudgetPerso {
  revenuNetMensuel: number;
  anneeReference: number;
  irEstime: number;
  tvaEstimee: number;
  contributionTotaleEstimee: number;
  repartition: RepartitionItem[];
  methodologie: Methodologie;
}

export interface IndicateurMacro {
  annee: number;
  pibCourant: number | null;
  population: number | null;
  sourcePibUrl: string | null;
  sourcePopulationUrl: string | null;
}

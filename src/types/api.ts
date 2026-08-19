// Types "Dto" : miroir exact des réponses JSON de l'API (snake_case, Pydantic).
// Ne pas ajouter de champ qui n'existe pas côté backend.

export type TypeRecetteDto = 'IR' | 'TVA' | 'IS' | 'TICPE' | 'AUTRES';

export interface AnneeBudgetListItemDto {
  annee: number;
  depenses_nettes: number;
  recettes_nettes: number;
  deficit: number;
}

export interface AnneeBudgetResponseDto {
  annee: number;
  depenses_nettes: number;
  recettes_nettes: number;
  deficit: number;
  dette_pib: number | null;
  source_url: string;
}

export interface RecetteResponseDto {
  annee: number;
  type: TypeRecetteDto;
  montant_brut: number;
  montant_net: number;
}

export interface MissionResponseDto {
  id: number;
  slug: string;
  nom_normalise: string;
  nom_officiel: string;
  annee: number;
  montant_total: number;
}

export interface MissionHistoriqueItemDto {
  annee: number;
  nom_officiel: string;
}

export interface ActionDetailItemDto {
  id: number;
  code: string;
  nom: string;
  ae: number;
  cp: number;
}

export interface ProgrammeDetailItemDto {
  id: number;
  code: string;
  nom: string;
  montant_total: number;
  actions: ActionDetailItemDto[];
}

export interface MissionDetailResponseDto {
  id: number;
  slug: string;
  nom_officiel: string;
  annee: number;
  montant_total: number;
  programmes: ProgrammeDetailItemDto[];
}

export interface ProgrammeResponseDto {
  id: number;
  mission_id: number;
  code: string;
  nom: string;
  annee: number;
}

export interface MissionDeltaItemDto {
  slug: string;
  nom: string;
  montant_a: number;
  montant_b: number;
  delta_absolu: number;
  delta_relatif_pct: number | null;
}

export interface RecetteDeltaItemDto {
  type: TypeRecetteDto;
  montant_a: number | null;
  montant_b: number | null;
  delta_absolu: number | null;
  delta_relatif_pct: number | null;
}

export interface ComparateurResponseDto {
  annee_a: AnneeBudgetResponseDto;
  annee_b: AnneeBudgetResponseDto;
  ecart_depenses: number;
  ecart_recettes: number;
  ecart_deficit: number;
  missions: MissionDeltaItemDto[];
  recettes: RecetteDeltaItemDto[];
}

export interface SourceCiteeDto {
  nom: string;
  url: string;
}

export interface MethodologieInfoDto {
  hypotheses: string[];
  limites: string[];
  sources: SourceCiteeDto[];
}

export interface RepartitionItemDto {
  mission_slug: string;
  mission_nom: string;
  montant: number;
}

export interface BudgetPersoResponseDto {
  revenu_net_mensuel: number;
  annee_reference: number;
  ir_estime: number;
  tva_estimee: number;
  contribution_totale_estimee: number;
  repartition: RepartitionItemDto[];
  methodologie: MethodologieInfoDto;
}

export interface IndicateurMacroResponseDto {
  annee: number;
  pib_courant: number | null;
  population: number | null;
  source_pib_url: string | null;
  source_population_url: string | null;
}

export type StatutMontantDto = 'chiffre' | 'epsilon' | 'non_calculable' | 'aucun_effet';

export interface DepenseFiscaleResponseDto {
  annee: number;
  numero: string;
  categorie: string;
  sous_categorie: string;
  sous_sous_categorie: string | null;
  libelle: string;
  beneficiaire: string;
  montant_millions: number | null;
  statut_montant: StatutMontantDto;
  methode_chiffrage: string | null;
}

export interface MarchePublicResponseDto {
  id: number;
  marche_id_source: string;
  nature: string | null;
  objet: string;
  codecpv: string;
  codecpv_division: string;
  procedure: string | null;
  acheteur_siret: string;
  titulaire_siret: string;
  titulaire_id_type: string | null;
  dureemois: number | null;
  datenotification: string;
  datepublicationdonnees: string | null;
  montant: number;
  formeprix: string | null;
  offresrecues: number | null;
  marcheinnovant: boolean | null;
}

export interface MarchesPageResponseDto {
  items: MarchePublicResponseDto[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MarchesCpvRepartitionItemDto {
  cpv_division: string;
  label: string;
  montant_total: number;
  nombre: number;
}

export interface MarchesBornesResponseDto {
  date_min: string | null;
  date_max: string | null;
  montant_min: number | null;
  montant_max: number | null;
}

// Réponse d'erreur RFC 7807 (application/problem+json), renvoyée par l'API
// pour tout 404/422/500.
export interface ProblemDetailsDto {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

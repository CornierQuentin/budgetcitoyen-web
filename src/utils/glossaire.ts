// Glossaire des termes techniques utilisés dans l'interface, affichés en
// tooltip via <GlossaryTerm /> (cf. cahier des charges, section 6.2 :
// « Tooltip systématique sur les termes techniques : déficit, AE, CP, PLF,
// LOLF... » et section 10 « Glossaire »).
//
// Définitions reprises du cahier des charges (CDC/BudgetCitoyen_CDC_v1.1.docx,
// section 10) lorsqu'elles y figurent ; complétées sinon.

export const glossaire: Record<string, string> = {
  AE: "Autorisation d'Engagement : montant maximal qu'un gestionnaire peut engager sur plusieurs années.",
  CP: "Crédit de Paiement : montant pouvant être effectivement décaissé dans l'année budgétaire.",
  PLF: 'Projet de Loi de Finances : texte soumis au Parlement en octobre pour vote du budget de l’année suivante.',
  LFI: 'Loi de Finances Initiale : PLF une fois voté et promulgué par le Parlement.',
  Mission:
    "Regroupement de programmes concourant à une même politique publique (ex : Enseignement scolaire).",
  Programme:
    "Unité de spécialisation des crédits, placée sous la responsabilité d'un responsable de programme.",
  Action: "Subdivision d'un programme décrivant une activité ou un objectif précis.",
  LOLF: 'Loi Organique relative aux Lois de Finances — cadre juridique structurant le budget depuis 2006.',
  DGFiP:
    'Direction Générale des Finances Publiques — administration qui collecte les impôts.',
  déficit:
    "Écart entre les dépenses et les recettes de l'État sur une année : les dépenses dépassent les recettes.",
  // Types de recettes (TypeRecette, src/types/domain.ts) : clés alignées sur
  // les valeurs exactes de l'enum, réutilisées telles quelles dans le
  // Comparateur (colonne « type » de recette) comme dans le Tableau de bord.
  IR: 'Impôt sur le Revenu : impôt payé par les particuliers sur leurs revenus.',
  TVA: 'Taxe sur la Valeur Ajoutée : impôt sur la consommation, payé par les ménages et les entreprises.',
  IS: 'Impôt sur les Sociétés : impôt payé par les entreprises sur leurs bénéfices.',
  TICPE:
    'Taxe Intérieure de Consommation sur les Produits Énergétiques : taxe sur les carburants et autres produits énergétiques.',
  AUTRES: 'Autres recettes fiscales et non fiscales (hors IR, TVA, IS et TICPE).',
};

export type GlossaryTermKey = keyof typeof glossaire;

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trois publics servis **à parts égales** (arbitrage explicite de l'auteur du projet, août 2026 — le CDC les listait sans les hiérarchiser) :

- **Le citoyen néophyte** — ne connaît rien au budget de l'État, vient chercher des ordres de grandeur et repart avec une compréhension intuitive.
- **Le lycéen / l'étudiant** — prépare un exposé ou un TPE : besoin de comprendre vite, de citer des sources officielles et de récupérer des visuels.
- **Le journaliste / l'élu local** — vient chercher des données granulaires, précises et exportables.

Un quatrième public, **le développeur**, consomme les données via l'API REST publique et documentée (Swagger) sans passer par l'interface.

## Product Purpose

Rendre le budget de l'État français accessible, compréhensible et explorable par tout citoyen. Les données budgétaires françaises sont publiques mais inexploitables en pratique : CSV du ministère des Finances, annexes du PLF, rapports de la Cour des comptes forment une masse que seuls des experts savent lire. Le succès, c'est qu'un néophyte reparte avec une intuition juste des ordres de grandeur, et qu'un journaliste reparte avec un chiffre sourcé et exportable.

## Positioning

Les outils voisins (ouvontmesimpots.fr, monbudgetpourlafrance.fr) couvrent partiellement le sujet. BudgetCitoyen combine ce qu'aucun ne réunit : historique interactif multi-annuel, dépenses **et** recettes comparables entre deux années, moteur de recherche des marchés publics (689 062 marchés, 2010→aujourd'hui), dépenses fiscales/niches, simulateur budgétaire, et une API REST publique. Chaque chiffre est relié à sa source officielle cliquable.

## Operating Context

Consultation web, majoritairement depuis un navigateur grand public, souvent à partir d'un lien partagé (chaque vue produit une URL partageable avec ses filtres). Les usages réels vont de la lecture rapide de trois chiffres clés à l'export CSV d'un tableau complet pour un article ou un exposé. Les données sont annuelles (PLF/LFI) sauf les marchés publics, mis à jour quotidiennement à la source.

## Capabilities and Constraints

Pages en service : accueil, tableau de bord national (par année, avec détail par mission → programmes → actions), historique pluriannuel, comparateur deux années, budget personnalisé, simulateur budgétaire, niches fiscales, marchés publics, page données/sources.

Contraintes techniques confirmées : React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 ; graphiques via Recharts ; backend FastAPI/PostgreSQL séparé (2 dépôts) ; Time To Interactive visé < 2 s.

Terminologie métier à préserver et à expliciter (tooltips en place) : mission, programme, action, AE, CP, PLF, LOLF, déficit, solde budgétaire.

## Brand Commitments

- **Neutralité politique absolue** — données factuelles, zéro commentaire partisan. Contrainte fondatrice : aucune mise en scène ne doit suggérer un jugement sur une politique publique.
- **Sourçage systématique** — chaque chiffre affiché porte une icône source cliquable vers le document officiel (CDC §6.2). Non négociable.
- **Open source** — code et pipeline sous licence AGPL-3.0-or-later.
- **Progressive disclosure** — chaque niveau de profondeur est un choix de l'utilisateur, jamais une obligation.
- Nom et domaine : BudgetCitoyen.fr. Aucun logo ni charte graphique n'existe à ce jour.
- **Registre visuel : le standard de la catégorie, joué franchement.** Choix explicite de l'auteur (août 2026), après lui avoir présenté des directions alternatives : l'interface doit se tenir à côté de **Stripe Dashboard** et de **Google Analytics / Cloud Console**, dont le niveau de finition fixe la barre. Coque applicative assumée : barre supérieure + rail de navigation latéral permanent. Ce n'est pas un défaut de nerf mais une destination revendiquée — les futures refontes partent de là, sans ironie ni excentricité contrebandée.

## Evidence on Hand

Données réelles en base, issues de sources publiques officielles (Licence Ouverte v2.0) : dépenses PLF/LFI par mission/programme/action (2006→2026), recettes fiscales par type (IR, TVA, IS, TICPE, autres), dépenses fiscales (niches), marchés publics DECP (689 062 lignes). Sources : data.economie.gouv.fr, data.gouv.fr, budget.gouv.fr, ccomptes.fr, insee.fr, Légifrance.

Absences à ne jamais combler par invention : aucun nom d'entreprise ni d'acheteur dans les marchés publics (seulement des identifiants SIRET) ; pas de donnée de population 2026 (l'indicateur par Français est indisponible cette année-là) ; aucun témoignage, aucune métrique d'audience, aucun partenaire institutionnel.

## Product Principles

1. **Le chiffre appartient à sa source.** Rien n'est affiché sans lien vérifiable vers le document officiel qui l'établit.
2. **La neutralité est une contrainte de conception, pas seulement d'écriture.** Couleurs, ordres et emphases ne doivent pas connoter politiquement.
3. **La profondeur est offerte, jamais imposée.** Trois chiffres suffisent à repartir ; le détail par action est atteignable pour qui le veut.
4. **Trois publics, une seule page.** La même vue doit rester lisible pour un néophyte et suffisamment précise pour un journaliste — pas de version « simplifiée » séparée.
5. **Tout est récupérable.** Toute visualisation s'exporte en PNG, toute donnée en CSV, toute vue en URL partageable.

## Accessibility & Inclusion

WCAG 2.1 AA visé. Responsive mobile-first. Mode sombre supporté nativement (`prefers-color-scheme` + bascule manuelle). Animations désactivables via `prefers-reduced-motion`.

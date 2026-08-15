# Contribuer à BudgetCitoyen.fr — Frontend

Merci de votre intérêt pour BudgetCitoyen.fr ! Ce document décrit les conventions à
suivre pour contribuer au frontend, cohérentes avec celles du backend.

## Workflow Git

- `main` : branche de production, toujours stable et déployable.
- `develop` : branche d'intégration pour les prochaines versions.
- `feat/nom-de-la-fonctionnalite` : branches de fonctionnalité, créées depuis
  `develop` et fusionnées dans `develop` via pull request.

## Convention de commits

Ce projet suit [Conventional Commits](https://www.conventionalcommits.org/fr/) avec des
messages rédigés **en français** :

```
feat: ajoute le composant de treemap budgétaire
fix: corrige le formatage des montants en euros
docs: met à jour le README
refactor: simplifie le hook useHistorique
test: ajoute des tests pour le store de filtres
chore: met à jour les dépendances
```

Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## Avant d'ouvrir une pull request

Assurez-vous que les commandes suivantes passent sans erreur :

```bash
npm run lint && npx tsc --noEmit && npm run test
```

Le build complet peut également être vérifié avec :

```bash
npm run build
```

## Style de code

- Le code est formaté avec Prettier (`npm run lint` inclut la cohérence avec la config
  ESLint/Prettier).
- Les composants React sont typés avec TypeScript en mode strict.
- Les noms de champs côté frontend sont en `camelCase`, même si l'API backend renvoie
  du `snake_case` (le mapping se fait dans la couche `services`/`hooks`).

## Signaler un bug ou proposer une fonctionnalité

Ouvrez une issue sur le dépôt en décrivant le contexte, le comportement observé et le
comportement attendu.

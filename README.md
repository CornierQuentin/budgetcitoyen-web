# BudgetCitoyen.fr — Frontend

Interface web open source du projet **BudgetCitoyen.fr**, qui rend le budget de l'État
français explorable par toutes et tous : missions, programmes, actions, dépenses et
recettes, présentés de façon claire et pédagogique.

Ce dépôt contient le frontend React. Il consomme l'API du backend BudgetCitoyen (dépôt
séparé) et n'embarque aucune donnée gouvernementale ni appel réseau réel — ce scaffold
est un point de départ pour le développement (Phase 1).

## Stack technique

- [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/) — bundler et serveur de développement
- [Tailwind CSS 3](https://tailwindcss.com/) — styles utilitaires, mode sombre natif
  (`prefers-color-scheme`)
- [Recharts](https://recharts.org/) et [D3.js](https://d3js.org/) — visualisation de
  données
- [TanStack React Query](https://tanstack.com/query/latest) — gestion des données serveur
- [Zustand](https://github.com/pmndrs/zustand) — état global léger
- [React Router 6](https://reactrouter.com/) — routage
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Axios](https://axios-http.com/) — client HTTP

Qualité : ESLint 8 (`eslint-config-airbnb` + `eslint-config-airbnb-typescript`),
Prettier, Vitest + React Testing Library.

## Démarrage

### Avec Docker (recommandé)

Depuis la racine du workspace parent (qui contient également le backend) :

```bash
docker compose up
```

### En local

```bash
npm install
npm run dev
```

L'application est alors disponible sur [http://localhost:5173](http://localhost:5173).

Copiez `.env.example` vers `.env` et ajustez `VITE_API_BASE_URL` si nécessaire pour
pointer vers votre instance de l'API backend.

## Scripts disponibles

| Commande          | Description                                   |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Démarre le serveur de développement Vite       |
| `npm run build`    | Vérifie les types puis construit l'application |
| `npm run lint`     | Analyse le code avec ESLint                    |
| `npm run test`     | Exécute les tests avec Vitest                  |
| `npm run preview`  | Prévisualise le build de production            |

## État du projet

Ce scaffold fournit la structure de fichiers, le routage, le store, les hooks de
données et des composants de visualisation squelettes (placeholders "à implémenter
Phase 1"). Aucune vraie donnée budgétaire n'est encore branchée.

## Licence

Ce projet est distribué sous licence [AGPL-3.0-or-later](./LICENSE).

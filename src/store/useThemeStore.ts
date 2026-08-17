import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

// Choix manuel déjà persisté par l'utilisateur, s'il existe. `null` signifie
// « aucun choix explicite » : dans ce cas, la préférence système fait foi et
// reste suivie en direct (cf. écouteur matchMedia plus bas).
function lireChoixManuel(): Theme | null {
  if (typeof window === 'undefined') return null;
  const valeur = window.localStorage.getItem(THEME_STORAGE_KEY);
  return valeur === 'light' || valeur === 'dark' ? valeur : null;
}

function lirePreferenceSysteme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Applique/retire la classe `dark` sur <html>, seul point d'entrée lu par
// `darkMode: 'class'` dans tailwind.config.js.
function appliquerClasseDocument(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Calculé et appliqué dès l'évaluation de ce module (donc avant le premier
// rendu React, puisque ce module est importé statiquement en amont, via
// Header.tsx) : évite un flash de mauvais thème au chargement.
const themeInitial: Theme = lireChoixManuel() ?? lirePreferenceSysteme();
appliquerClasseDocument(themeInitial);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: themeInitial,
  setTheme: (theme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    appliquerClasseDocument(theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const suivant: Theme = state.theme === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(THEME_STORAGE_KEY, suivant);
      appliquerClasseDocument(suivant);
      return { theme: suivant };
    });
  },
}));

// Suit les changements de préférence système en direct, tant que
// l'utilisateur n'a jamais fait de choix manuel explicite (aucune valeur en
// localStorage) : dès qu'un choix manuel existe (toggle ou setTheme), il
// prime définitivement sur la préférence système.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemPreferenceChange = (event: MediaQueryListEvent) => {
    if (lireChoixManuel() !== null) return;
    const suivant: Theme = event.matches ? 'dark' : 'light';
    appliquerClasseDocument(suivant);
    useThemeStore.setState({ theme: suivant });
  };

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onSystemPreferenceChange);
  } else if (typeof mql.addListener === 'function') {
    // Safari < 14
    mql.addListener(onSystemPreferenceChange);
  }
}

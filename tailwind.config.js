/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // 'class' (et non 'media') : nécessaire pour supporter un toggle manuel en
  // plus de la préférence système — avec 'media' seul, impossible de forcer
  // un mode indépendamment de prefers-color-scheme (cf. cahier des charges,
  // section 6.2 : « Mode sombre supporté nativement (prefers-color-scheme +
  // toggle manuel) »). La classe `dark` est posée/retirée sur <html> par
  // src/store/useThemeStore.ts.
  darkMode: 'class',
  theme: {
    extend: {
      // Adossé aux variables CSS définies dans src/index.css (:root et .dark).
      // Le thème sombre bascule donc par redéfinition de valeurs, sans qu'aucun
      // composant n'ait à porter de variante `dark:` sur la couleur.
      colors: {
        ground: 'var(--ground)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
          hover: 'var(--surface-hover)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          line: 'var(--accent-line)',
          contrast: 'var(--accent-contrast)',
        },
        pos: { DEFAULT: 'var(--pos)', soft: 'var(--pos-soft)' },
        neg: { DEFAULT: 'var(--neg)', soft: 'var(--neg-soft)' },
        warn: { DEFAULT: 'var(--warn)', soft: 'var(--warn-soft)' },
        data: {
          1: 'var(--data-1)',
          2: 'var(--data-2)',
          3: 'var(--data-3)',
          4: 'var(--data-4)',
          5: 'var(--data-5)',
        },
        bar: { DEFAULT: 'var(--bar)', track: 'var(--bar-track)' },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
    },
  },
  plugins: [],
};

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
    extend: {},
  },
  plugins: [],
};

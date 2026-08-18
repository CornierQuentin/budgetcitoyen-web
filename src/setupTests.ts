import '@testing-library/jest-dom';

// jsdom n'implémente pas ResizeObserver, requis par recharts
// (ResponsiveContainer) pour tous les graphiques (DonutChart, LineChart).
// Polyfill minimal : aucun test n'a besoin d'observer un vrai redimensionnement.
// Fonction constructeur (et non une classe) : ses méthodes n'ont rien à faire
// de `this`, ce qui déclencherait la règle ESLint class-methods-use-this.
function ResizeObserverMock(this: ResizeObserver) {
  this.observe = () => {};
  this.unobserve = () => {};
  this.disconnect = () => {};
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

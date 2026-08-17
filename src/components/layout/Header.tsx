import { Link } from 'react-router-dom';

import { useThemeStore } from '../../store/useThemeStore';
import { Nav } from './Nav';

export default function Header() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const estSombre = theme === 'dark';
  const libelleAction = estSombre ? 'Passer en mode clair' : 'Passer en mode sombre';

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="text-lg font-bold text-blue-900 dark:text-blue-300">
          BudgetCitoyen.fr
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <Nav />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={libelleAction}
            title={libelleAction}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300
              text-base leading-none text-gray-700 transition-colors hover:bg-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-800 dark:border-gray-600
              dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-blue-400"
          >
            <span aria-hidden="true">{estSombre ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

import { Link } from 'react-router-dom';

import { Nav } from './Nav';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="text-lg font-bold text-blue-900">
          BudgetCitoyen.fr
        </Link>
        <Nav />
      </div>
    </header>
  );
}

export default Header;

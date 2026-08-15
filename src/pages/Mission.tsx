import { useParams } from 'react-router-dom';

export function Mission() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <section className="rounded-lg border border-gray-200 p-4">
      <h2 className="text-xl font-semibold text-gray-900">Mission : {slug}</h2>
      <p className="mt-2 text-sm text-gray-500">Détail de la mission — à implémenter Phase 1.</p>
    </section>
  );
}

export default Mission;

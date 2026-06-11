import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRegions } from '@/hooks/useCatalog';

/**
 * Barre de recherche du hero — CTA principal du modèle « marketplace ».
 * Réduit la friction : rechercher est l'action prioritaire.
 */
export function HeroSearch() {
  const navigate = useNavigate();
  const { data: regions } = useRegions();
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (region) params.set('region', region);
    navigate(`/catalogue${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-lg sm:flex-row sm:items-center"
      role="search"
      aria-label="Rechercher des produits agricoles"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Quel produit cherchez-vous ?"
          aria-label="Produit"
          className="h-12 w-full rounded-xl border-0 bg-transparent pl-11 pr-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div className="relative sm:w-48">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Région"
          className="h-12 w-full cursor-pointer appearance-none rounded-xl border-0 bg-gray-50 pl-11 pr-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:bg-transparent"
        >
          <option value="">Toutes régions</option>
          {regions?.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="lg" className="h-12 shrink-0">
        <Search className="h-5 w-5" /> Rechercher
      </Button>
    </form>
  );
}

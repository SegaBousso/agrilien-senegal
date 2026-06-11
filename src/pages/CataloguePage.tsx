import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton, EmptyState, ErrorState } from '@/components/ui/States';
import { usePublicListings } from '@/hooks/useListings';
import { useCategories, useRegions } from '@/hooks/useCatalog';
import { useFavoriteIds } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { ListingFilters } from '@/services/listings.service';

const PAGE_SIZE = 12;

export default function CataloguePage() {
  const [params, setParams] = useSearchParams();
  const { role } = useAuth();
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();
  const { data: favoriteIds } = useFavoriteIds();
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(params.get('page') ?? '1');
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '');

  const filters = useMemo<ListingFilters>(
    () => ({
      search: params.get('q') ?? undefined,
      categoryId: params.get('categorie') ?? undefined,
      region: params.get('region') ?? undefined,
      minPrice: params.get('prixMin') ? Number(params.get('prixMin')) : undefined,
      maxPrice: params.get('prixMax') ? Number(params.get('prixMax')) : undefined,
      minQuantity: params.get('qteMin') ? Number(params.get('qteMin')) : undefined,
      sort: (params.get('tri') as ListingFilters['sort']) ?? 'recent',
      page,
      pageSize: PAGE_SIZE,
    }),
    [params, page],
  );

  const { data, isLoading, isError, refetch } = usePublicListings(filters);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('q', searchInput.trim());
  };

  const clearAll = () => {
    setSearchInput('');
    setParams(new URLSearchParams());
  };

  const favSet = new Set(favoriteIds ?? []);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const activeCategory = params.get('categorie') ?? '';

  // Puces de filtres actifs (supprimables).
  const activeChips: { key: string; label: string }[] = [];
  if (params.get('q')) activeChips.push({ key: 'q', label: `« ${params.get('q')} »` });
  if (activeCategory) {
    activeChips.push({
      key: 'categorie',
      label: categories?.find((c) => c.id === activeCategory)?.name ?? 'Catégorie',
    });
  }
  if (params.get('region')) activeChips.push({ key: 'region', label: params.get('region')! });
  if (params.get('prixMin')) activeChips.push({ key: 'prixMin', label: `≥ ${params.get('prixMin')} FCFA` });
  if (params.get('prixMax')) activeChips.push({ key: 'prixMax', label: `≤ ${params.get('prixMax')} FCFA` });
  if (params.get('qteMin')) activeChips.push({ key: 'qteMin', label: `Qté ≥ ${params.get('qteMin')}` });

  const removeChip = (key: string) => {
    if (key === 'q') setSearchInput('');
    setParam(key, '');
  };

  return (
    <>
      <Seo title="Catalogue" description="Parcourez et filtrez les annonces de produits agricoles frais au Sénégal." />

      {/* En-tête */}
      <div className="border-b border-border bg-gray-50">
        <div className="container py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            <Search className="h-3.5 w-3.5" /> Catalogue
          </span>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Le marché agricole, à portée de clic</h1>
          <p className="mt-1.5 text-gray-600">
            {data
              ? `${data.total} annonce${data.total > 1 ? 's' : ''} fraîche${data.total > 1 ? 's' : ''} disponible${data.total > 1 ? 's' : ''}`
              : 'Recherchez parmi les récoltes disponibles'}
          </p>

          {/* Recherche */}
          <form onSubmit={submitSearch} className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher un produit (mangue, mil, oignon…)"
                className="h-12 pl-12 text-base"
                aria-label="Rechercher"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">
              Rechercher
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowFilters((v) => !v)}
              className="shrink-0 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeChips.length > 0 && (
                <span className="ml-1 rounded-full bg-primary-600 px-1.5 text-xs text-white">
                  {activeChips.length}
                </span>
              )}
            </Button>
          </form>

          {/* Puces catégories — accès rapide */}
          {categories && categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <CategoryPill active={!activeCategory} onClick={() => setParam('categorie', '')}>
                Toutes
              </CategoryPill>
              {categories.map((c) => (
                <CategoryPill
                  key={c.id}
                  active={activeCategory === c.id}
                  onClick={() => setParam('categorie', activeCategory === c.id ? '' : c.id)}
                >
                  {c.name}
                </CategoryPill>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
        {/* Filtres */}
        <aside className={showFilters ? 'block' : 'hidden lg:block'}>
          <div className="sticky top-20 space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <Filter className="h-4 w-4 text-primary-600" /> Filtres
              </h2>
              {activeChips.length > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-primary-700 hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>

            <FilterBlock label="Catégorie">
              <Select value={activeCategory} onChange={(e) => setParam('categorie', e.target.value)}>
                <option value="">Toutes</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FilterBlock>

            <FilterBlock label="Région">
              <Select value={params.get('region') ?? ''} onChange={(e) => setParam('region', e.target.value)}>
                <option value="">Toutes</option>
                {regions?.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FilterBlock>

            <FilterBlock label="Prix (FCFA)">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  defaultValue={params.get('prixMin') ?? ''}
                  onBlur={(e) => setParam('prixMin', e.target.value)}
                  aria-label="Prix minimum"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Max"
                  defaultValue={params.get('prixMax') ?? ''}
                  onBlur={(e) => setParam('prixMax', e.target.value)}
                  aria-label="Prix maximum"
                />
              </div>
            </FilterBlock>

            <FilterBlock label="Quantité minimum">
              <Input
                type="number"
                min={0}
                placeholder="Ex. 100"
                defaultValue={params.get('qteMin') ?? ''}
                onBlur={(e) => setParam('qteMin', e.target.value)}
                aria-label="Quantité minimum"
              />
            </FilterBlock>
          </div>
        </aside>

        {/* Résultats */}
        <section>
          {/* Barre : tri + filtres actifs */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.length > 0 ? (
                activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => removeChip(chip.key)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-3 pr-2 text-sm font-medium text-primary-700 ring-1 ring-primary-100 transition hover:bg-primary-100"
                  >
                    {chip.label}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">{data && `Page ${page} sur ${totalPages}`}</p>
              )}
            </div>
            <Select
              value={params.get('tri') ?? 'recent'}
              onChange={(e) => setParam('tri', e.target.value)}
              className="w-auto"
              aria-label="Trier"
            >
              <option value="recent">Plus récentes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </Select>
          </div>

          {isError ? (
            <ErrorState action={<Button onClick={() => refetch()}>Réessayer</Button>} />
          ) : isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    isFavorite={favSet.has(l.id)}
                    showFavorite={role === 'buyer'}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                  >
                    Précédent
                  </Button>
                  <span className="px-3 text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                  >
                    Suivant
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              icon={<X className="h-12 w-12" />}
              title="Aucun résultat"
              description="Aucune annonce ne correspond à vos critères. Essayez d'élargir votre recherche."
              action={<Button onClick={clearAll}>Réinitialiser les filtres</Button>}
            />
          )}
        </section>
      </div>
    </>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary-600 text-white shadow-soft'
          : 'border border-border bg-surface text-gray-700 hover:border-primary-300 hover:text-primary-700',
      )}
    >
      {children}
    </button>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">{label}</p>
      {children}
    </div>
  );
}

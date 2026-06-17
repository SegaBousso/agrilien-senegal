import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle2, ExternalLink } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ListingStatusBadge } from '@/components/dashboard/StatusBadge';
import { useAdminListings } from '@/hooks/useAdmin';
import { useUpdateListingStatus } from '@/hooks/useListings';
import { useToast } from '@/context/ToastContext';
import { cn, formatPrice, formatRelative } from '@/lib/utils';
import { LISTING_STATUS_LABELS, PLACEHOLDER_IMAGE } from '@/lib/constants';
import type { ListingStatus } from '@/types/database';

const PAGE_SIZE = 15;

const FILTERS: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'publiee', label: 'Publiées' },
  { value: 'suspendue', label: 'Suspendues' },
  { value: 'all', label: 'Toutes' },
];

export default function AdminListings() {
  const [filter, setFilter] = useState<ListingStatus | 'all'>('en_attente');
  const [page, setPage] = useState(1);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const { data, isLoading } = useAdminListings(filter === 'all' ? undefined : filter, page);
  const updateStatus = useUpdateListingStatus();
  const { toast } = useToast();

  const listings = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const changeFilter = (f: ListingStatus | 'all') => {
    setFilter(f);
    setPage(1);
  };

  const moderate = async (id: string, status: ListingStatus) => {
    setModeratingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
      toast(`Annonce ${LISTING_STATUS_LABELS[status].toLowerCase()}.`, 'success');
    } catch {
      toast('Action impossible.', 'error');
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <>
      <Seo title="Modération des annonces" />
      <PageHeader title="Modération des annonces" description="Validez, publiez ou suspendez les annonces." />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => changeFilter(f.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              filter === f.value
                ? 'bg-primary-600 text-white shadow-soft'
                : 'bg-surface text-gray-600 ring-1 ring-border hover:bg-muted',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : listings.length > 0 ? (
        <>
          <div className="space-y-3">
            {listings.map((l) => {
              const img = l.images?.find((i) => i.is_main)?.image_url ?? l.images?.[0]?.image_url ?? PLACEHOLDER_IMAGE;
              const busy = moderatingId === l.id;
              return (
                <div key={l.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-shadow hover:shadow-md sm:flex-row sm:items-center">
                  <img src={img} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-gray-900">{l.title}</h3>
                      <ListingStatusBadge status={l.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {l.producer?.farm_name} · {l.region} · {formatPrice(l.price)} · {formatRelative(l.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link to={`/annonce/${l.id}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" /> Voir
                      </Button>
                    </Link>
                    {l.status !== 'publiee' && (
                      <Button size="sm" onClick={() => moderate(l.id, 'publiee')} loading={busy}>
                        <CheckCircle2 className="h-4 w-4" /> Publier
                      </Button>
                    )}
                    {l.status !== 'suspendue' && (
                      <Button variant="danger" size="sm" disabled={busy} onClick={() => moderate(l.id, 'suspendue')}>
                        <Ban className="h-4 w-4" /> Suspendre
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState title="Aucune annonce" description="Aucune annonce dans cette catégorie." />
      )}
    </>
  );
}

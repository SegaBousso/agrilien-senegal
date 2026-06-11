import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Inbox, ListChecks, PlusCircle } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { PageHeader, StatCard } from '@/components/dashboard/PageHeader';
import { ListingStatusBadge } from '@/components/dashboard/StatusBadge';
import { useMyListings } from '@/hooks/useListings';
import { useReceivedRequests } from '@/hooks/useRequests';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, formatRelative } from '@/lib/utils';

export default function ProducerDashboard() {
  const { producerId, profile } = useAuth();
  const { data: listings, isLoading } = useMyListings(producerId);
  const listingIds = useMemo(() => (listings ?? []).map((l) => l.id), [listings]);
  const { data: requests } = useReceivedRequests(listingIds);

  if (isLoading) return <Spinner />;

  const published = (listings ?? []).filter((l) => l.status === 'publiee').length;
  const pending = (listings ?? []).filter((l) => l.status === 'en_attente').length;
  const newRequests = (requests ?? []).filter((r) => r.status === 'nouvelle').length;

  return (
    <>
      <Seo title="Tableau de bord producteur" />
      <PageHeader
        title={`Bonjour, ${profile?.full_name?.split(' ')[0] ?? ''} 👋`}
        description="Vue d'ensemble de votre activité sur AgriLien."
        action={
          <Link to="/producteur/annonce/nouvelle">
            <Button>
              <PlusCircle className="h-4 w-4" /> Nouvelle annonce
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annonces totales" value={listings?.length ?? 0} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard label="Publiées" value={published} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-primary-50 text-primary-600" />
        <StatCard label="En attente" value={pending} icon={<Clock className="h-5 w-5" />} accent="bg-accent-100 text-accent-600" />
        <StatCard label="Nouvelles demandes" value={newRequests} icon={<Inbox className="h-5 w-5" />} accent="bg-blue-50 text-blue-600" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Dernières annonces */}
        <div className="rounded-2xl border border-gray-100 bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Dernières annonces</h2>
            <Link to="/producteur/annonces" className="text-sm font-medium text-primary-700 hover:underline">
              Tout voir
            </Link>
          </div>
          {listings && listings.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {listings.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link to={`/producteur/annonce/${l.id}/modifier`} className="truncate font-medium text-gray-900 hover:text-primary-700">
                      {l.title}
                    </Link>
                    <p className="text-xs text-gray-500">{formatPrice(l.price)} · {formatRelative(l.created_at)}</p>
                  </div>
                  <ListingStatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-gray-500">Aucune annonce pour l'instant.</p>
          )}
        </div>

        {/* Demandes récentes */}
        <div className="rounded-2xl border border-gray-100 bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Demandes récentes</h2>
            <Link to="/producteur/demandes" className="text-sm font-medium text-primary-700 hover:underline">
              Tout voir
            </Link>
          </div>
          {requests && requests.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {requests.slice(0, 5).map((r) => (
                <li key={r.id} className="py-3">
                  <p className="truncate font-medium text-gray-900">{r.listing?.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.buyer?.full_name} · {r.quantity_requested} {r.listing?.unit} · {formatRelative(r.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-gray-500">Aucune demande reçue.</p>
          )}
        </div>
      </div>
    </>
  );
}

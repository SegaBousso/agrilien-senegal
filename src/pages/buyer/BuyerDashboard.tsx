import { Link } from 'react-router-dom';
import { Heart, Search, Send } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { PageHeader, StatCard } from '@/components/dashboard/PageHeader';
import { Panel, PanelEmpty } from '@/components/dashboard/Panel';
import { ListingCard } from '@/components/listings/ListingCard';
import { RequestStatusBadge } from '@/components/dashboard/StatusBadge';
import { useFavoriteListings } from '@/hooks/useFavorites';
import { useMyRequests } from '@/hooks/useRequests';
import { useAuth } from '@/context/AuthContext';
import { formatRelative } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function BuyerDashboard() {
  const { session, profile } = useAuth();
  const { data: favorites, isLoading: loadingFav } = useFavoriteListings();
  const { data: requests, isLoading: loadingReq } = useMyRequests(session?.user.id);

  if (loadingFav || loadingReq) return <Spinner />;

  const activeRequests = (requests ?? []).filter((r) =>
    ['nouvelle', 'en_discussion', 'acceptee'].includes(r.status),
  ).length;

  return (
    <>
      <Seo title="Tableau de bord acheteur" />
      <PageHeader
        title={`Bonjour, ${profile?.full_name?.split(' ')[0] ?? ''} 👋`}
        description="Retrouvez vos favoris et le suivi de vos demandes."
        action={
          <Link to="/catalogue">
            <Button>
              <Search className="h-4 w-4" /> Parcourir le catalogue
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Favoris" value={favorites?.length ?? 0} icon={<Heart className="h-5 w-5" />} accent="bg-red-50 text-red-500" />
        <StatCard label="Demandes envoyées" value={requests?.length ?? 0} icon={<Send className="h-5 w-5" />} accent="bg-blue-50 text-blue-600" />
        <StatCard label="Demandes actives" value={activeRequests} icon={<Send className="h-5 w-5" />} />
      </div>

      {/* Demandes récentes */}
      <div className="mt-8">
        <Panel title="Mes dernières demandes" to="/acheteur/demandes">
          {requests && requests.length > 0 ? (
            <ul className="space-y-1">
              {requests.slice(0, 5).map((r) => {
                const img =
                  r.listing?.images?.find((i) => i.is_main)?.image_url ??
                  r.listing?.images?.[0]?.image_url ??
                  PLACEHOLDER_IMAGE;
                return (
                  <li key={r.id} className="-mx-2 flex items-center gap-3 rounded-xl p-2">
                    <img src={img} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{r.listing?.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.quantity_requested} {r.listing?.unit} · {formatRelative(r.created_at)}
                      </p>
                    </div>
                    <RequestStatusBadge status={r.status} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <PanelEmpty>Vous n'avez pas encore envoyé de demande.</PanelEmpty>
          )}
        </Panel>
      </div>

      {/* Favoris */}
      {favorites && favorites.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">Vos favoris</h2>
            <Link to="/acheteur/favoris" className="text-sm font-medium text-primary-700 hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.slice(0, 3).map((l) => (
              <ListingCard key={l.id} listing={l} isFavorite />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

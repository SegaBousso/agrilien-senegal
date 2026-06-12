import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Inbox, Leaf, ListChecks, Percent, PlusCircle, Wallet } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState } from '@/components/ui/States';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { PageHeader, StatCard } from '@/components/dashboard/PageHeader';
import { Panel, PanelEmpty } from '@/components/dashboard/Panel';
import { BarChart } from '@/components/charts/BarChart';
import { ListingStatusBadge, RequestStatusBadge } from '@/components/dashboard/StatusBadge';
import { useMyListings } from '@/hooks/useListings';
import { useReceivedRequests } from '@/hooks/useRequests';
import { useProducerImpactStats, useProducerRevenueTrend } from '@/hooks/useProducerStats';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, formatQuantity, formatRelative, initials } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

export default function ProducerDashboard() {
  const { producerId, profile } = useAuth();
  const { data: listings, isLoading } = useMyListings(producerId);
  const listingIds = useMemo(() => (listings ?? []).map((l) => l.id), [listings]);
  const { data: requests } = useReceivedRequests(listingIds);
  const { data: impact } = useProducerImpactStats(!!producerId);
  const { data: revenueTrend = [] } = useProducerRevenueTrend(!!producerId);

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

      {/* Impact (agrégé en base, isolé par producteur) */}
      {impact && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Mon impact</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenu encaissé"
              value={formatPrice(impact.revenu_paye)}
              icon={<Wallet className="h-5 w-5" />}
              accent="bg-primary-50 text-primary-600"
            />
            <StatCard
              label="Pertes évitées"
              value={formatQuantity(impact.pertes_evitees_kg, 'kg')}
              icon={<Leaf className="h-5 w-5" />}
              accent="bg-primary-50 text-primary-600"
            />
            <StatCard
              label="Ventes payées"
              value={impact.transactions_payees}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accent="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Taux d'acceptation"
              value={`${impact.taux_acceptation}%`}
              icon={<Percent className="h-5 w-5" />}
            />
          </div>

          <Card className="mt-6">
            <CardBody>
              <CardTitle className="mb-5">Revenu encaissé par mois (6 mois)</CardTitle>
              {revenueTrend.length > 0 ? (
                <BarChart data={revenueTrend} formatValue={(v) => formatPrice(v)} />
              ) : (
                <EmptyState title="Aucun paiement encaissé pour l'instant" />
              )}
            </CardBody>
          </Card>
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Dernières annonces */}
        <Panel title="Dernières annonces" to="/producteur/annonces">
          {listings && listings.length > 0 ? (
            <ul className="space-y-1">
              {listings.slice(0, 5).map((l) => {
                const img =
                  l.images?.find((i) => i.is_main)?.image_url ?? l.images?.[0]?.image_url ?? PLACEHOLDER_IMAGE;
                return (
                  <li key={l.id}>
                    <Link
                      to={`/producteur/annonce/${l.id}/modifier`}
                      className="group -mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                    >
                      <img src={img} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 group-hover:text-primary-700">{l.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(l.price)} · {formatRelative(l.created_at)}
                        </p>
                      </div>
                      <ListingStatusBadge status={l.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <PanelEmpty>Aucune annonce pour l'instant.</PanelEmpty>
          )}
        </Panel>

        {/* Demandes récentes */}
        <Panel title="Demandes récentes" to="/producteur/demandes">
          {requests && requests.length > 0 ? (
            <ul className="space-y-1">
              {requests.slice(0, 5).map((r) => (
                <li key={r.id} className="-mx-2 flex items-center gap-3 rounded-xl p-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {initials(r.buyer?.full_name ?? '?')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{r.listing?.title}</p>
                    <p className="truncate text-xs text-gray-500">
                      {r.buyer?.full_name} · {r.quantity_requested} {r.listing?.unit} · {formatRelative(r.created_at)}
                    </p>
                  </div>
                  <RequestStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmpty>Aucune demande reçue.</PanelEmpty>
          )}
        </Panel>
      </div>
    </>
  );
}

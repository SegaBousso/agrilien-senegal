import {
  CheckCircle2,
  Clock,
  Leaf,
  ListChecks,
  Percent,
  Send,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Spinner, EmptyState } from '@/components/ui/States';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { PageHeader, StatCard } from '@/components/dashboard/PageHeader';
import { DonutChart, type DonutSegment } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';
import {
  useAdminStats,
  useImpactStats,
  usePriceTrend,
  useVolumeByCategory,
} from '@/hooks/useAdmin';
import { CHART_COLORS } from '@/lib/constants';
import { formatPrice, formatQuantity } from '@/lib/utils';

export default function AdminStats() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: impact } = useImpactStats();
  const { data: priceTrend = [] } = usePriceTrend(6);
  const { data: volumeByCategory = [] } = useVolumeByCategory();
  if (isLoading || !stats) return <Spinner />;

  const accountSegments: DonutSegment[] = [
    { label: 'Producteurs', value: stats.totalProducers, color: CHART_COLORS.primary },
    { label: 'Acheteurs', value: stats.totalBuyers, color: CHART_COLORS.blue },
  ];

  const otherUsers = Math.max(0, stats.totalUsers - stats.totalProducers - stats.totalBuyers);
  if (otherUsers > 0) {
    accountSegments.push({ label: 'Autres', value: otherUsers, color: CHART_COLORS.accent });
  }

  const listingSegments = [
    { label: 'Publiées', value: stats.publishedListings, color: CHART_COLORS.primary },
    { label: 'En attente', value: stats.pendingListings, color: CHART_COLORS.accent },
    {
      label: 'Autres',
      value: Math.max(0, stats.totalListings - stats.publishedListings - stats.pendingListings),
      color: CHART_COLORS.earth,
    },
  ].filter((s) => s.value > 0);

  return (
    <>
      <Seo title="Statistiques" />
      <PageHeader title="Statistiques" description="Indicateurs détaillés de la plateforme." />

      {/* Impact (agrégé en base via RPC) */}
      {impact && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-gray-900">Impact</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pertes évitées"
              value={formatQuantity(impact.pertes_evitees_kg, 'kg')}
              icon={<Leaf className="h-5 w-5" />}
              accent="bg-primary-50 text-primary-600"
            />
            <StatCard
              label="Montant payé"
              value={formatPrice(impact.montant_paye)}
              icon={<Wallet className="h-5 w-5" />}
              accent="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Transactions payées"
              value={impact.transactions_payees}
              icon={<TrendingUp className="h-5 w-5" />}
              accent="bg-accent-100 text-accent-600"
            />
            <StatCard
              label="Taux d'acceptation"
              value={`${impact.taux_acceptation}%`}
              icon={<Percent className="h-5 w-5" />}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardBody>
                <CardTitle className="mb-5">Évolution du prix moyen (6 mois)</CardTitle>
                {priceTrend.length > 0 ? (
                  <BarChart
                    data={priceTrend}
                    color={CHART_COLORS.blue}
                    formatValue={(v) => formatPrice(v)}
                  />
                ) : (
                  <EmptyState title="Pas encore de données" />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle className="mb-5">Pertes évitées par catégorie</CardTitle>
                {volumeByCategory.length > 0 ? (
                  <BarChart
                    data={volumeByCategory}
                    formatValue={(v) => formatQuantity(v, 'kg')}
                  />
                ) : (
                  <EmptyState title="Pas encore d'échanges finalisés" />
                )}
              </CardBody>
            </Card>
          </div>
        </section>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Producteurs" value={stats.totalProducers} icon={<Sprout className="h-5 w-5" />} />
        <StatCard label="Acheteurs" value={stats.totalBuyers} icon={<Store className="h-5 w-5" />} accent="bg-blue-50 text-blue-600" />
        <StatCard label="Demandes" value={stats.totalRequests} icon={<Send className="h-5 w-5" />} accent="bg-accent-100 text-accent-600" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Annonces totales" value={stats.totalListings} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard label="Publiées" value={stats.publishedListings} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-primary-50 text-primary-600" />
        <StatCard label="En attente" value={stats.pendingListings} icon={<Clock className="h-5 w-5" />} accent="bg-accent-100 text-accent-600" />
      </div>

      {/* Graphiques */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle className="mb-4">Répartition des comptes</CardTitle>
            {stats.totalUsers > 0 ? (
              <DonutChart
                data={accountSegments}
                centerValue={stats.totalUsers}
                centerLabel="comptes"
              />
            ) : (
              <EmptyState title="Aucun utilisateur" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle className="mb-4">État des annonces</CardTitle>
            {stats.totalListings > 0 ? (
              <DonutChart
                data={listingSegments}
                centerValue={stats.totalListings}
                centerLabel="annonces"
              />
            ) : (
              <EmptyState title="Aucune annonce" />
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody>
          <CardTitle className="mb-5">Annonces par région</CardTitle>
          <BarChart data={stats.listingsByRegion.map((r) => ({ label: r.region, value: r.count }))} />
        </CardBody>
      </Card>
    </>
  );
}

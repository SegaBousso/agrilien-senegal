import { Link } from 'react-router-dom';
import { Clock, ListChecks, Package, Send, Users } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Spinner } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { PageHeader, StatCard } from '@/components/dashboard/PageHeader';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';
import { useAdminStats } from '@/hooks/useAdmin';
import { CHART_COLORS } from '@/lib/constants';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) return <Spinner />;

  const accountSegments = [
    { label: 'Producteurs', value: stats.totalProducers, color: CHART_COLORS.primary },
    { label: 'Acheteurs', value: stats.totalBuyers, color: CHART_COLORS.blue },
  ];

  return (
    <>
      <Seo title="Tableau de bord admin" />
      <PageHeader title="Administration" description="Vue d'ensemble de la plateforme AgriLien." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Annonces" value={stats.totalListings} icon={<ListChecks className="h-5 w-5" />} />
        <StatCard
          label="En attente de validation"
          value={stats.pendingListings}
          icon={<Clock className="h-5 w-5" />}
          accent="bg-accent-100 text-accent-600"
        />
        <StatCard label="Demandes d'achat" value={stats.totalRequests} icon={<Send className="h-5 w-5" />} accent="bg-blue-50 text-blue-600" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle className="mb-4">Répartition des comptes</CardTitle>
            {stats.totalUsers > 0 ? (
              <DonutChart data={accountSegments} centerValue={stats.totalUsers} centerLabel="comptes" />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucun compte pour le moment.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle className="mb-4">État des annonces</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat icon={<Package className="h-4 w-4" />} label="Publiées" value={stats.publishedListings} />
              <MiniStat icon={<Clock className="h-4 w-4" />} label="En attente" value={stats.pendingListings} />
            </div>
            <Link to="/admin/annonces" className="mt-4 block">
              <Button variant="subtle" className="w-full">
                Modérer les annonces
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody>
          <CardTitle className="mb-5">Annonces par région</CardTitle>
          <BarChart data={stats.listingsByRegion.slice(0, 8).map((r) => ({ label: r.region, value: r.count }))} />
        </CardBody>
      </Card>
    </>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

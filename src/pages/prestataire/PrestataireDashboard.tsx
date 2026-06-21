import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, Crown, MapPin, Pencil, ShieldCheck, Star, Wrench } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { useAuth } from '@/context/AuthContext';
import { useMyProvider } from '@/hooks/useProviders';
import { formatDate } from '@/lib/utils';

const STATUS = {
  verifie: { label: 'Vérifié — visible au carnet', cls: 'bg-primary-50 text-primary-800 border-primary-200', Icon: BadgeCheck },
  en_attente: { label: 'En attente de vérification', cls: 'bg-accent-50 text-accent-600 border-accent-200', Icon: Clock },
  non_verifie: { label: 'Non vérifié — demandez la vérification', cls: 'bg-gray-100 text-gray-600 border-border', Icon: ShieldCheck },
  rejete: { label: 'Vérification refusée', cls: 'bg-red-50 text-red-700 border-red-200', Icon: ShieldCheck },
} as const;

export default function PrestataireDashboard() {
  const { profile } = useAuth();
  const { data: mine, isLoading } = useMyProvider(profile?.id);

  if (isLoading) return <Spinner />;

  return (
    <>
      <Seo title="Tableau de bord prestataire" />
      <PageHeader
        title={`Bonjour, ${profile?.full_name?.split(' ')[0] ?? ''} 👋`}
        description="Gérez votre fiche de service et votre visibilité au Carnet."
        action={
          <Link to="/prestataire/profil">
            <Button>
              <Pencil className="h-4 w-4" /> {mine ? 'Modifier ma fiche' : 'Créer ma fiche'}
            </Button>
          </Link>
        }
      />

      {!mine ? (
        <EmptyState
          title="Vous n'avez pas encore de fiche"
          description="Créez votre fiche, cochez les services que vous proposez, puis demandez la vérification pour apparaître au Carnet."
          action={
            <Link to="/prestataire/profil">
              <Button>Créer ma fiche</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Statut */}
            {(() => {
              const s = STATUS[mine.verification_status];
              return (
                <div className={`flex items-center gap-3 rounded-2xl border p-4 ${s.cls}`}>
                  <s.Icon className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">{s.label}</p>
                </div>
              );
            })()}

            {/* Fiche résumée */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-gray-900">{mine.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" /> {mine.region}
                    {mine.commune ? ` · ${mine.commune}` : ''}
                  </p>
                </div>
                {mine.membership_active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-semibold text-accent-600">
                    <Star className="h-3.5 w-3.5" /> Partenaire
                  </span>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Wrench className="h-3.5 w-3.5" /> Services proposés
                </p>
                {(mine.services ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(mine.services ?? []).map((s) => (
                      <span key={s.id} className="rounded-full bg-muted px-2.5 py-1 text-xs text-gray-700">
                        {s.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Aucun service coché.{' '}
                    <Link to="/prestataire/profil" className="font-medium text-primary-700 hover:underline">
                      En ajouter
                    </Link>
                  </p>
                )}
              </div>

              {mine.verification_status === 'verifie' && (
                <Link
                  to="/services"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline"
                >
                  Voir ma fiche au Carnet →
                </Link>
              )}
            </div>

            {/* Adhésion Partenaire (réservée aux fiches vérifiées) */}
            {mine.verification_status === 'verifie' && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                      <Crown className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display font-semibold text-gray-900">
                        {mine.membership_active ? 'Partenaire actif' : 'Devenez Partenaire'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {mine.membership_active
                          ? `Votre fiche est mise en avant${mine.membership_until ? ` jusqu'au ${formatDate(mine.membership_until)}` : ''}.`
                          : 'Remontez en tête du Carnet avec le cachet « Partenaire ». Choisissez un forfait.'}
                      </p>
                    </div>
                  </div>
                  <Link to="/services/partenaire" className="shrink-0">
                    <Button variant={mine.membership_active ? 'outline' : 'primary'} size="sm">
                      <Crown className="h-4 w-4" />
                      {mine.membership_active ? 'Renouveler' : 'Voir les forfaits'}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <WeatherWidget region={mine.region} />
        </div>
      )}
    </>
  );
}

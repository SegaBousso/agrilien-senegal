import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BookMarked, Check, Crown, PhoneCall, Route } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useActivePlans } from '@/hooks/useMembershipPlans';
import { useInitiateMembership } from '@/hooks/useProviders';
import { formatPrice } from '@/lib/utils';
import type { MembershipPlan } from '@/types/database';

const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif';
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const BISSAP = '#8A1C3B';
const INK = '#17120C';
const PAPER = '#FAF8F3';

const FREE_FEATURES = [
  'Fiche listée au Carnet après vérification',
  'Cachet « Vérifié » par AgriLien',
  'Appel & WhatsApp directs, sans intermédiaire',
];

const PARTNER_FEATURES = [
  'Fiche remontée en tête du Carnet',
  'Cachet « Partenaire » distinctif',
  'Priorité dans les résultats de votre région',
];

function durationLabel(days: number): string {
  if (days === 30) return 'par mois';
  if (days === 90) return 'pour 3 mois';
  if (days === 365) return 'par an';
  return `pour ${days} jours`;
}

export default function ServicesPartnerPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plans = [], isLoading } = useActivePlans();
  const initiate = useInitiateMembership();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const pick = async (plan: MembershipPlan) => {
    // Le paiement n'est possible que pour un prestataire (fiche vérifiée requise,
    // contrôlée côté serveur). Sinon, on l'oriente vers la création de compte.
    if (role !== 'prestataire') {
      navigate('/inscription');
      return;
    }
    setPendingId(plan.id);
    try {
      const { redirect_url } = await initiate.mutateAsync(plan.id);
      window.location.href = redirect_url;
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Paiement indisponible pour le moment.', 'error');
      setPendingId(null);
    }
  };

  return (
    <div style={{ backgroundColor: PAPER }}>
      <Seo
        title="Forfaits Partenaire — le Carnet du marché"
        description="Rejoignez le Carnet AgriLien. Inscription gratuite après vérification, ou forfait Partenaire pour la mise en avant : mensuel, trimestriel, annuel."
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="container py-12 lg:py-16">
          <p
            className="flex items-center gap-2 text-[11px] uppercase text-gray-500"
            style={{ fontFamily: MONO, letterSpacing: '0.18em' }}
          >
            <BookMarked className="h-3.5 w-3.5" style={{ color: BISSAP }} />
            Le Carnet · pour les prestataires
          </p>
          <h1
            className="mt-3 max-w-3xl text-4xl leading-[1.05] text-gray-900 sm:text-5xl lg:text-[3.4rem]"
            style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Vos bras valent de l’or.
            <br />
            <span style={{ color: BISSAP }}>Rendez-les visibles.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
            Producteurs et acheteurs cherchent chaque jour un transporteur ou un tracteur. Inscrivez
            votre service au Carnet : ils vous trouvent par région et vous appellent en direct.
          </p>

          <div className="mt-7 grid gap-4 sm:max-w-2xl sm:grid-cols-3">
            {[
              { icon: PhoneCall, t: 'Contact direct', d: 'On vous appelle, sans commission.' },
              { icon: Route, t: 'Par région', d: 'Visible là où vous travaillez.' },
              { icon: BadgeCheck, t: 'Vérifié', d: 'La confiance avant l’appel.' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-border bg-surface p-4">
                <f.icon className="h-5 w-5" style={{ color: BISSAP }} />
                <p className="mt-2 text-sm font-semibold text-gray-900" style={{ fontFamily: ED }}>
                  {f.t}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Palier gratuit ───────────────────────────────────────────────── */}
      <section className="container pt-12">
        <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-7 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase text-gray-400" style={{ fontFamily: MONO, letterSpacing: '0.14em' }}>
              Inscription · gratuite
            </p>
            <h2 className="mt-2 text-2xl text-gray-900" style={{ fontFamily: ED, fontWeight: 700 }}>
              Entrez au Carnet, simplement
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-primary-600" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/inscription"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-900 px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
          >
            Créer mon compte <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Forfaits Partenaire (tarification) ───────────────────────────── */}
      <section className="container py-12 lg:py-16">
        <div className="text-center">
          <p className="text-[11px] uppercase" style={{ fontFamily: MONO, letterSpacing: '0.18em', color: BISSAP }}>
            <Crown className="mr-1 inline h-3.5 w-3.5" /> Passez Partenaire
          </p>
          <h2
            className="mt-3 text-2xl text-gray-900 sm:text-3xl"
            style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            Choisissez votre forfait
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Tout de l’inscription gratuite, plus la mise en avant. Plus la durée est longue, plus c’est avantageux.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-10">
            <Spinner />
          </div>
        ) : plans.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-500">
            Aucun forfait disponible pour l’instant.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const featured = plan.highlight;
              return (
                <div
                  key={plan.id}
                  className="relative flex flex-col rounded-3xl border p-7 shadow-soft"
                  style={
                    featured
                      ? { backgroundColor: INK, borderColor: INK }
                      : { backgroundColor: 'rgb(255 255 255 / 1)', borderColor: 'rgb(var(--border))' }
                  }
                >
                  {featured && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] uppercase text-white"
                      style={{ background: BISSAP, fontFamily: MONO, letterSpacing: '0.12em' }}
                    >
                      Recommandé
                    </span>
                  )}
                  <p
                    className="text-[11px] uppercase"
                    style={{ fontFamily: MONO, letterSpacing: '0.14em', color: featured ? '#CE7E95' : '#9ca3af' }}
                  >
                    {plan.name}
                  </p>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span
                      className="text-3xl"
                      style={{ fontFamily: ED, fontWeight: 700, color: featured ? PAPER : INK }}
                    >
                      {formatPrice(plan.price)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs" style={{ fontFamily: MONO, color: featured ? 'rgba(250,248,243,0.6)' : '#9ca3af' }}>
                    {durationLabel(plan.duration_days)}
                  </p>
                  {plan.description && (
                    <p className="mt-3 text-sm" style={{ color: featured ? 'rgba(250,248,243,0.75)' : '#6b7280' }}>
                      {plan.description}
                    </p>
                  )}

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {PARTNER_FEATURES.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm"
                        style={{ color: featured ? 'rgba(250,248,243,0.92)' : '#374151' }}
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: featured ? '#86efac' : '#16a34a' }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => pick(plan)}
                    loading={pendingId === plan.id}
                    className="mt-7 w-full"
                    variant={featured ? 'accent' : 'primary'}
                  >
                    {role === 'prestataire' ? 'Choisir ce forfait' : 'Devenir prestataire'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mx-auto mt-8 max-w-lg text-center text-xs text-gray-400">
          Paiement mobile (Orange Money, Wave) ou carte, sans engagement. L’adhésion se règle depuis
          votre espace une fois votre fiche vérifiée — vous restez gratuit aussi longtemps que vous voulez.
        </p>
      </section>

      {/* ── Renvoi vers le Carnet ────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="container flex flex-col items-start justify-between gap-4 py-10 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-600">Curieux de voir à quoi ça ressemble&nbsp;?</p>
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BISSAP }}>
            Consulter le Carnet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

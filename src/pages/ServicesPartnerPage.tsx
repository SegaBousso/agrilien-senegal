import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BookMarked, Check, Crown, PhoneCall, Route, TrendingUp } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { useAuth } from '@/context/AuthContext';
import { MEMBERSHIP } from '@/lib/constants';

const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif';
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const BISSAP = '#8A1C3B';
const INK = '#17120C';
const PAPER = '#FAF8F3';

const FREE_FEATURES = [
  'Fiche listée au Carnet après vérification',
  'Cachet « Vérifié » par AgriLien',
  'Appel & WhatsApp directs, sans intermédiaire',
  'Zones desservies et services affichés',
];

const PARTNER_FEATURES = [
  'Tout de l’inscription gratuite',
  'Fiche remontée en tête du Carnet',
  'Cachet « Partenaire » distinctif',
  'Priorité dans les résultats de votre région',
];

export default function ServicesPartnerPage() {
  const { role } = useAuth();
  // Le paiement se déclenche depuis l'espace prestataire (fiche vérifiée requise).
  const partnerCta =
    role === 'prestataire'
      ? { to: '/prestataire/dashboard', label: 'Activer dans mon espace' }
      : { to: '/inscription', label: 'Devenir prestataire' };

  return (
    <div style={{ backgroundColor: PAPER }}>
      <Seo
        title="Devenir prestataire — le Carnet du marché"
        description="Transporteurs, opérateurs de mécanisation : rejoignez le Carnet AgriLien. Inscription gratuite après vérification, option Partenaire pour la mise en avant."
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

      {/* ── Les deux paliers ─────────────────────────────────────────────── */}
      <section className="container py-12 lg:py-16">
        <h2
          className="text-center text-2xl text-gray-900 sm:text-3xl"
          style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          Deux façons d’y figurer
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-gray-500">
          On commence gratuitement. On passe Partenaire quand on veut être devant.
        </p>

        <div className="mx-auto mt-10 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {/* Palier gratuit */}
          <div className="flex flex-col rounded-3xl border border-border bg-surface p-7 shadow-soft">
            <p className="text-[11px] uppercase text-gray-400" style={{ fontFamily: MONO, letterSpacing: '0.14em' }}>
              Inscription
            </p>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl text-gray-900" style={{ fontFamily: ED, fontWeight: 700 }}>
                Gratuit
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">Pour entrer au Carnet, simplement.</p>
            <ul className="mt-6 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/inscription"
              className="mt-7 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              Créer mon compte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Palier Partenaire (mis en avant) */}
          <div
            className="relative flex flex-col rounded-3xl p-7 text-white shadow-soft-lg"
            style={{ backgroundColor: INK }}
          >
            <span
              className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase"
              style={{ background: BISSAP, fontFamily: MONO, letterSpacing: '0.12em' }}
            >
              <Crown className="h-3 w-3" /> Recommandé
            </span>
            <p className="text-[11px] uppercase" style={{ fontFamily: MONO, letterSpacing: '0.14em', color: '#CE7E95' }}>
              Partenaire
            </p>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl" style={{ fontFamily: ED, fontWeight: 700, color: PAPER }}>
                {MEMBERSHIP.priceLabel}
              </span>
              <span className="text-sm" style={{ color: 'rgba(250,248,243,0.6)' }}>
                / {MEMBERSHIP.periodLabel}
              </span>
            </p>
            <p className="mt-2 text-sm" style={{ color: 'rgba(250,248,243,0.6)' }}>
              Pour passer devant, là où ça compte.
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {PARTNER_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(250,248,243,0.92)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#86efac' }} /> {f}
                </li>
              ))}
            </ul>
            <Link
              to={partnerCta.to}
              className="mt-7 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: PAPER, color: INK }}
            >
              <Crown className="h-4 w-4" /> {partnerCta.label}
            </Link>
            <p className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(250,248,243,0.5)' }}>
              <TrendingUp className="h-3 w-3" /> Paiement mobile (Orange Money, Wave). Sans engagement.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-xs text-gray-400">
          L’option Partenaire se règle depuis votre espace, une fois votre fiche vérifiée. Vous pouvez
          rester en inscription gratuite aussi longtemps que vous voulez.
        </p>
      </section>

      {/* ── Renvoi vers le Carnet ────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="container flex flex-col items-start justify-between gap-4 py-10 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-600">
            Curieux de voir à quoi ça ressemble&nbsp;?
          </p>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: BISSAP }}
          >
            Consulter le Carnet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

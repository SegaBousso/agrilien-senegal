import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, Tractor, Truck } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/States';
import { ProviderCard } from '@/components/services/ProviderCard';
import { usePublicProviders } from '@/hooks/useProviders';
import {
  SENEGAL_REGIONS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_TAGLINES,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ServiceCategory } from '@/types/database';

const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif';
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const BISSAP = '#8A1C3B';
const INK = '#17120C';
const PAPER = '#FAF8F3';

const GLYPH = { transport: Truck, mecanisation: Tractor } as const;

export default function ServicesPage() {
  const [category, setCategory] = useState<ServiceCategory | undefined>(undefined);
  const [region, setRegion] = useState<string>('');

  const { data: providers = [], isLoading } = usePublicProviders({
    category,
    region: region || undefined,
  });

  return (
    <div style={{ backgroundColor: PAPER }}>
      <Seo
        title="Carnet des prestataires"
        description="Transporteurs et opérateurs de mécanisation vérifiés, région par région. Appelez-les directement."
      />

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="container py-12 lg:py-16">
          <p
            className="flex items-center gap-2 text-[11px] uppercase text-gray-500"
            style={{ fontFamily: MONO, letterSpacing: '0.18em' }}
          >
            <BookMarked className="h-3.5 w-3.5" style={{ color: BISSAP }} />
            Carnet du marché · prestataires vérifiés
          </p>
          <h1
            className="mt-3 max-w-3xl text-4xl leading-[1.05] text-gray-900 sm:text-5xl lg:text-6xl"
            style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Le carnet des
            <br />
            <span style={{ color: BISSAP }}>prestataires.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
            Les bras qui prolongent la récolte : transporteurs et opérateurs de mécanisation, contrôlés
            un à un par AgriLien. Pas d'intermédiaire, pas d'avance — vous appelez directement.
          </p>

          {/* Deux métiers d'ouverture */}
          <div className="mt-8 grid gap-3 sm:max-w-2xl sm:grid-cols-2">
            {SERVICE_CATEGORIES.map((c) => {
              const Icon = GLYPH[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(active ? undefined : c)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-all duration-200',
                    active ? 'shadow-soft' : 'hover:-translate-y-0.5 hover:shadow-soft',
                  )}
                  style={active ? { borderColor: BISSAP, backgroundColor: 'rgba(138,28,59,0.04)' } : undefined}
                  aria-pressed={active}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: active ? 'rgba(138,28,59,0.1)' : 'rgba(23,18,12,0.05)', color: active ? BISSAP : INK }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900" style={{ fontFamily: ED }}>
                      {SERVICE_CATEGORY_LABELS[c]}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                      {SERVICE_CATEGORY_TAGLINES[c]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Filtres + résultats ──────────────────────────────────────────── */}
      <section className="container py-10">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategory(undefined)}
              className={cn(
                'rounded-full px-4 py-1.5 text-[12px] uppercase transition-colors',
                !category ? 'text-white' : 'bg-muted text-gray-600 hover:bg-gray-200',
              )}
              style={{ fontFamily: MONO, letterSpacing: '0.1em', backgroundColor: !category ? INK : undefined }}
            >
              Tous
            </button>
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[12px] uppercase transition-colors',
                  category === c ? 'text-white' : 'bg-muted text-gray-600 hover:bg-gray-200',
                )}
                style={{
                  fontFamily: MONO,
                  letterSpacing: '0.1em',
                  backgroundColor: category === c ? BISSAP : undefined,
                }}
              >
                {SERVICE_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-56">
            <Select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filtrer par région">
              <option value="">Toutes les régions</option>
              {SENEGAL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : providers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <p className="text-gray-900" style={{ fontFamily: ED, fontWeight: 700, fontSize: '1.125rem' }}>
              Aucun prestataire ici pour l'instant
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Le carnet se remplit région par région. Vous proposez un service de transport ou de
              mécanisation&nbsp;? Inscrivez-vous — vous serez parmi les premiers.
            </p>
            <Link
              to="/services/inscription"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: BISSAP }}
            >
              Inscrire mon service <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <p
              className="mb-5 text-[12px] uppercase text-gray-400"
              style={{ fontFamily: MONO, letterSpacing: '0.1em' }}
            >
              {providers.length} {providers.length > 1 ? 'fiches' : 'fiche'} au carnet
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Appel aux prestataires ───────────────────────────────────────── */}
      <section className="border-t border-border" style={{ backgroundColor: INK }}>
        <div className="container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p
              className="text-[11px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: '0.18em', color: 'rgba(250,248,243,0.6)' }}
            >
              Vous proposez un service ?
            </p>
            <h2
              className="mt-2 text-2xl sm:text-3xl"
              style={{ fontFamily: ED, fontWeight: 700, color: PAPER, letterSpacing: '-0.01em' }}
            >
              Entrez au carnet du marché
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(250,248,243,0.7)' }}>
              Inscription gratuite. Après vérification, votre fiche est visible des producteurs et
              acheteurs de votre région — qui vous appellent directement.
            </p>
          </div>
          <Link
            to="/services/inscription"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
            style={{ backgroundColor: PAPER, color: INK }}
          >
            Inscrire mon service <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

import { BadgeCheck, Lightbulb, MapPin, PawPrint, Phone, Tractor, Truck, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';
import { SERVICE_DOMAIN_LABELS } from '@/lib/constants';
import type { ServiceDomain, ServiceProvider } from '@/types/database';

const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif';
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const BISSAP = '#8A1C3B';
const INK = '#17120C';

const GLYPH: Record<ServiceDomain, ComponentType<{ className?: string }>> = {
  transport: Truck,
  mecanisation: Tractor,
  elevage: PawPrint,
  conseil: Lightbulb,
  autre: Wrench,
};

/** Domaine dominant d'un prestataire (1er service coché), pour le glyphe + libellé. */
function primaryDomain(p: ServiceProvider): ServiceDomain {
  return p.services?.[0]?.domain ?? 'autre';
}

/** Numéro de fiche court, façon registre tenu à la main (déterministe). */
function refNo(id: string) {
  return id.replace(/[^0-9a-f]/gi, '').slice(0, 4).toUpperCase();
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits.startsWith('+') ? digits : digits.replace(/^00/, '+')}`;
}

function waHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('221') ? digits : `221${digits.replace(/^0+/, '')}`;
  return `https://wa.me/${intl}`;
}

/**
 * Signature du Carnet : chaque prestataire est une « fiche de registre ».
 * Glyphe du domaine, numéro de fiche en mono, cachet vérifié, services proposés
 * en étiquettes, et contact direct. Les Partenaires portent un liseré bissap.
 */
export function ProviderCard({ provider }: { provider: ServiceProvider }) {
  const domain = primaryDomain(provider);
  const Icon = GLYPH[domain];
  const featured = provider.membership_active;
  const services = provider.services ?? [];
  const areas = provider.service_areas.filter((a) => a !== provider.region);

  return (
    <article
      className="group relative flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
      style={featured ? { borderColor: BISSAP } : undefined}
    >
      {featured && (
        <span
          className="absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] uppercase text-white"
          style={{ background: BISSAP, fontFamily: MONO, letterSpacing: '0.12em' }}
        >
          Partenaire
        </span>
      )}

      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: featured ? 'rgba(138,28,59,0.08)' : 'rgba(23,18,12,0.05)', color: featured ? BISSAP : INK }}
        >
          <Icon className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="flex items-center gap-2 text-[11px] uppercase text-gray-500"
            style={{ fontFamily: MONO, letterSpacing: '0.12em' }}
          >
            <span>{SERVICE_DOMAIN_LABELS[domain]}</span>
            <span className="text-gray-300">·</span>
            <span>N°{refNo(provider.id)}</span>
          </p>

          <h3
            className="mt-1 flex items-center gap-1.5 text-lg leading-snug text-gray-900"
            style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            <span className="truncate">{provider.name}</span>
            <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: BISSAP }} aria-label="Vérifié" />
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500" style={{ fontFamily: MONO }}>
            <MapPin className="h-3.5 w-3.5" /> {provider.region}
            {provider.commune ? ` · ${provider.commune}` : ''}
          </p>
        </div>
      </div>

      {/* Services proposés */}
      {services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {services.slice(0, 4).map((s) => (
            <span key={s.id} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-gray-700">
              {s.name}
            </span>
          ))}
          {services.length > 4 && <span className="text-[11px] text-gray-400">+{services.length - 4}</span>}
        </div>
      )}

      {provider.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">{provider.description}</p>
      )}

      {areas.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase text-gray-400" style={{ fontFamily: MONO, letterSpacing: '0.1em' }}>
            Dessert
          </span>
          {areas.slice(0, 4).map((a) => (
            <span key={a} className="text-[11px] text-gray-600">
              {a}
            </span>
          ))}
          {areas.length > 4 && <span className="text-[11px] text-gray-400">+{areas.length - 4}</span>}
        </div>
      )}

      {/* Contact direct */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <a
          href={telHref(provider.phone)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: BISSAP }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#73152f')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BISSAP)}
        >
          <Phone className="h-4 w-4" /> Appeler
        </a>
        {provider.whatsapp && (
          <a
            href={waHref(provider.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-muted"
          >
            WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}

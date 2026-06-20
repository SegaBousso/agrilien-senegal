import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, Leaf, MapPin, ShieldCheck, Sprout } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { HeroSearch } from '@/components/listings/HeroSearch';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton, EmptyState } from '@/components/ui/States';
import { useRecentListings } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCatalog';
import { formatPrice } from '@/lib/utils';
import { SENEGAL_REGIONS } from '@/lib/constants';

// ── Identité typographique propre à cette page (test) ───────────────────────
const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif'; // display éditorial
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace'; // registre

// Palette locale (non globale) : papier + encre + bissap (hibiscus) ; le vert
// reste un SIGNAL (frais / vérifié), pas une couleur de fond.
const BISSAP = '#8A1C3B';
const INK = '#17120C';

// Repli éditorial si le catalogue est vide (la maquette reste lisible en démo).
const SAMPLE = [
  { region: 'Dakar', title: 'Mangues Kent', price: 600, unit: 'kg', verified: true },
  { region: 'Kaolack', title: 'Oignons de Galmi', price: 350, unit: 'kg', verified: true },
  { region: 'Saint-Louis', title: 'Riz de la vallée', price: 400, unit: 'kg', verified: false },
  { region: 'Thiès', title: 'Pastèques', price: 1000, unit: 'unité', verified: true },
  { region: 'Kaolack', title: 'Mil souna', price: 300, unit: 'kg', verified: false },
];

/** Cachet « Producteur vérifié » — la signature de la page (style tampon). */
function Cachet({ className = '', size = 132 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 132 132"
      className={className}
      role="img"
      aria-label="Cachet : producteur vérifié par AgriLien"
    >
      <defs>
        <path id="ah2-ring" d="M66,66 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" fill="none" />
      </defs>
      <circle cx="66" cy="66" r="63" fill="none" stroke={BISSAP} strokeWidth="1.4" />
      <circle cx="66" cy="66" r="54" fill="none" stroke={BISSAP} strokeWidth="0.8" strokeDasharray="1 4" />
      <text fill={BISSAP} style={{ fontFamily: MONO, fontWeight: 600 }} fontSize="9.2" letterSpacing="3.1">
        <textPath href="#ah2-ring" startOffset="0">
          PRODUCTEUR VÉRIFIÉ · AGRILIEN · SÉNÉGAL ·&nbsp;
        </textPath>
      </text>
      <g transform="translate(66 66)">
        <path
          d="M-15 2 l9 9 l18 -20"
          fill="none"
          stroke="#16a34a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs uppercase"
      style={{ fontFamily: MONO, letterSpacing: '0.22em', color: BISSAP }}
    >
      {children}
    </span>
  );
}

export default function HomePageV2() {
  const { data: recent, isLoading } = useRecentListings(8);
  const { data: categories } = useCategories();

  const today = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date());

  const indexRows =
    recent && recent.length > 0
      ? recent.slice(0, 5).map((l) => ({
          region: l.region,
          title: l.title,
          price: l.price,
          unit: l.unit,
          verified: l.producer?.verification_status === 'verifie',
        }))
      : SAMPLE;

  return (
    <>
      <Seo
        title="Le registre du marché agricole — AgriLien Sénégal"
        description="L'index vivant des récoltes du Sénégal : qui vend quoi, où, à quel prix. Producteurs vérifiés, circuit court, sans commission."
      />

      <style>{`
        @keyframes ah2-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ah2-marquee { animation: ah2-marquee 38s linear infinite; }
        .ah2-row { transition: background-color .2s, padding-left .2s; }
        .ah2-row:hover { background-color: rgba(138,28,59,.05); padding-left: .5rem; }
        @media (prefers-reduced-motion: reduce) { .ah2-marquee { animation: none; } }
      `}</style>

      {/* ═══ HERO — l'index du marché ═══ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'rgb(var(--background))' }}>
        {/* trame légère + halo bissap */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(23,18,12,0.05) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full opacity-[0.10] blur-3xl"
          style={{ background: BISSAP }}
        />

        <div className="container relative grid items-start gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          {/* Colonne éditoriale */}
          <div className="hero-reveal" style={{ animationDelay: '0.05s' }}>
            <Eyebrow>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: BISSAP }} />
              Registre agricole · Sénégal · {today}
            </Eyebrow>

            <h1
              className="mt-6 text-balance text-5xl leading-[0.95] text-gray-900 md:text-6xl lg:text-[4.6rem]"
              style={{ fontFamily: ED, fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Qui récolte quoi,
              <br />
              où, et à{' '}
              <span style={{ color: BISSAP }}>quel juste prix.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-gray-600">
              AgriLien tient l'index vivant des récoltes du Sénégal. Vous y lisez, en clair, les
              produits disponibles, leur région et leur prix — auprès de producteurs vérifiés.
            </p>

            <div className="mt-8 max-w-xl">
              <HeroSearch />
            </div>

            {categories && categories.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase text-gray-400" style={{ fontFamily: MONO, letterSpacing: '0.18em' }}>
                  Rayons
                </span>
                {categories.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalogue?categorie=${c.id}`}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

          </div>

          {/* Colonne « index du jour » — ledger des offres réelles */}
          <aside className="hero-reveal relative" style={{ animationDelay: '0.18s' }}>
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft-lg">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <span className="text-xs uppercase text-gray-900" style={{ fontFamily: MONO, letterSpacing: '0.18em' }}>
                  L'index du jour
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ fontFamily: MONO, color: '#16a34a' }}>
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-600" />
                  EN DIRECT
                </span>
              </div>

              <ul>
                {indexRows.map((r, i) => (
                  <li key={i} className="ah2-row border-b border-border last:border-0">
                    <Link to="/catalogue" className="flex items-center gap-3 px-5 py-3.5">
                      <span className="w-6 shrink-0 text-xs text-gray-400" style={{ fontFamily: MONO }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="hidden w-28 shrink-0 truncate text-xs uppercase text-gray-500 sm:block"
                        style={{ fontFamily: MONO, letterSpacing: '0.08em' }}
                      >
                        {r.region}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="truncate font-medium text-gray-900">{r.title}</span>
                        {r.verified && <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: '#16a34a' }} />}
                      </span>
                      <span className="shrink-0 text-right" style={{ fontFamily: MONO, color: BISSAP }}>
                        {formatPrice(r.price)}
                        <span className="text-[11px] text-gray-400">/{r.unit}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                to="/catalogue"
                className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Ouvrir le catalogue complet
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500" style={{ fontFamily: MONO }}>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
              Le pictogramme <BadgeCheck className="inline h-3.5 w-3.5" style={{ color: '#16a34a' }} /> = producteur vérifié.
            </p>
          </aside>
        </div>

        {/* Bande registre — repères clés, pleine largeur, au pied du hero */}
        <div className="relative border-t border-border">
          <dl className="container grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {[
              { k: '0%', v: 'Commission' },
              { k: '14', v: 'Régions couvertes' },
              { k: '100%', v: 'Produits locaux' },
              { k: '24/7', v: 'Accessible' },
            ].map((s) => (
              <div key={s.v} className="px-1 py-6" style={{ backgroundColor: 'rgb(var(--background))' }}>
                <dt className="text-3xl text-gray-900" style={{ fontFamily: ED, fontWeight: 800 }}>
                  {s.k}
                </dt>
                <dd className="mt-1 text-xs uppercase text-gray-500" style={{ fontFamily: MONO, letterSpacing: '0.12em' }}>
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Ruban du terroir — couverture nationale (défile lentement) */}
        <div className="border-y border-border py-3" style={{ backgroundColor: INK }}>
          <div className="flex overflow-hidden">
            <div className="ah2-marquee flex shrink-0 items-center gap-6 whitespace-nowrap pr-6">
              {[...SENEGAL_REGIONS, ...SENEGAL_REGIONS].map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 text-sm"
                  style={{ fontFamily: MONO, color: '#FAF8F3', letterSpacing: '0.06em' }}
                >
                  <Leaf className="h-3.5 w-3.5" style={{ color: '#86efac' }} />
                  {r}
                  <span style={{ color: BISSAP }}>·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ÉTALS DU JOUR — annonces réelles ═══ */}
      <section className="container py-16 lg:py-20">
        <div className="flex items-end justify-between gap-4 border-b border-gray-900 pb-4">
          <div>
            <Eyebrow>Les étals du jour</Eyebrow>
            <h2 className="mt-2 text-3xl text-gray-900 md:text-4xl" style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Fraîchement publié
            </h2>
          </div>
          <Link to="/catalogue" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-gray-900 hover:text-[#8A1C3B] sm:inline-flex">
            Tout voir <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
          ) : recent && recent.length > 0 ? (
            recent.slice(0, 6).map((l) => <ListingCard key={l.id} listing={l} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title="Le registre s'ouvre bientôt"
                description="Les premières récoltes seront publiées sous peu. Revenez vite."
              />
            </div>
          )}
        </div>
      </section>

      {/* ═══ LE PACTE — bande encre, garanties en registre ═══ */}
      <section style={{ backgroundColor: INK }} className="py-16 lg:py-24">
        <div className="container">
          <Eyebrow>Le pacte AgriLien</Eyebrow>
          <h2
            className="mt-3 max-w-2xl text-3xl md:text-4xl"
            style={{ fontFamily: ED, fontWeight: 700, color: '#FAF8F3', letterSpacing: '-0.01em' }}
          >
            Quatre engagements, sans astérisque.
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: 'rgba(250,248,243,0.12)' }}>
            {[
              { n: '00', t: 'Sans commission', d: 'Vous gardez la valeur de votre récolte. AgriLien ne prélève rien sur la vente.' },
              { n: '01', t: 'Producteurs vérifiés', d: 'Un cachet « vérifié » après contrôle de l\'exploitation par notre équipe.' },
              { n: '02', t: 'Circuit court', d: 'Le producteur et l\'acheteur se parlent en direct, sans intermédiaire inutile.' },
              { n: '03', t: 'Juste prix', d: 'Le prix est affiché clairement, à la source, région par région.' },
            ].map((p) => (
              <div key={p.n} className="p-7" style={{ backgroundColor: INK }}>
                <span className="text-sm" style={{ fontFamily: MONO, color: BISSAP, letterSpacing: '0.1em' }}>
                  {p.n}
                </span>
                <h3 className="mt-4 text-lg" style={{ fontFamily: ED, fontWeight: 600, color: '#FAF8F3' }}>
                  {p.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(250,248,243,0.62)' }}>
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LA CONFIANCE, ESTAMPILLÉE — met en avant la vérification ═══ */}
      <section className="container py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex justify-center">
            <div
              className="flex aspect-square w-full max-w-sm items-center justify-center rounded-full border border-border"
              style={{ background: 'radial-gradient(circle at 50% 40%, rgba(138,28,59,0.06), transparent 70%)' }}
            >
              <Cachet size={228} />
            </div>
          </div>

          <div>
            <Eyebrow>La confiance, estampillée</Eyebrow>
            <h2 className="mt-3 text-3xl text-gray-900 md:text-4xl" style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Acheter à quelqu'un que la plateforme a vérifié.
            </h2>
            <p className="mt-4 max-w-xl text-gray-600">
              Comme sur les grandes places de marché, AgriLien contrôle les vendeurs avant de leur
              accorder un badge. Un producteur vérifié, c'est une exploitation réelle, identifiée,
              avec laquelle vous traitez en confiance.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: BadgeCheck, t: 'Badge « Producteur vérifié »', d: 'Affiché sur ses annonces et sa fiche, après examen par un administrateur.' },
                { icon: ShieldCheck, t: 'Demande, examen, décision', d: 'Le producteur soumet sa demande ; l\'équipe vérifie ses informations.' },
                { icon: Sprout, t: 'Identité de l\'exploitation', d: 'Nom de la ferme, région et commune visibles pour chaque vendeur.' },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(22,163,74,0.10)', color: '#16a34a' }}>
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.t}</h3>
                    <p className="mt-1 text-sm text-gray-600">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ CTA — double porte ═══ */}
      <section className="container pb-20">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2">
          <Link to="/inscription" className="group bg-surface p-9 transition hover:bg-gray-50">
            <Eyebrow>Vous récoltez</Eyebrow>
            <h3 className="mt-3 text-2xl text-gray-900" style={{ fontFamily: ED, fontWeight: 700 }}>
              Publiez vos récoltes
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-600">
              Touchez des acheteurs partout au Sénégal et faites-vous vérifier pour vendre en confiance.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BISSAP }}>
              Devenir producteur
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>

          <Link to="/catalogue" className="group p-9 transition" style={{ backgroundColor: INK }}>
            <span className="inline-flex items-center gap-2 text-xs uppercase" style={{ fontFamily: MONO, letterSpacing: '0.22em', color: '#86efac' }}>
              <MapPin className="h-3.5 w-3.5" /> Vous achetez
            </span>
            <h3 className="mt-3 text-2xl" style={{ fontFamily: ED, fontWeight: 700, color: '#FAF8F3' }}>
              Parcourez le marché
            </h3>
            <p className="mt-2 max-w-sm text-sm" style={{ color: 'rgba(250,248,243,0.62)' }}>
              Filtrez par produit et par région, comparez les prix, contactez le producteur en direct.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
              Ouvrir le catalogue
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}

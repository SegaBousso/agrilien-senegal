import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  Coins,
  Leaf,
  MapPin,
  RefreshCw,
  Route,
  Scale,
  ShieldCheck,
  Sprout,
  Tractor,
  Truck,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { HeroSearch } from '@/components/listings/HeroSearch';
import { EditorialListingCard } from '@/components/listings/EditorialListingCard';
import { KraftTag } from '@/components/listings/KraftTag';
import { ListingCardSkeleton, EmptyState } from '@/components/ui/States';
import { useRecentListings } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCatalog';
import { formatPrice, initials } from '@/lib/utils';
import { PLACEHOLDER_IMAGE, SENEGAL_REGIONS } from '@/lib/constants';
import type { ListingWithRelations } from '@/types/database';

// Image de secours pour la vedette du hero (catalogue vide en démo).
const FALLBACK_HERO_IMG =
  'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80';

function mainImage(l: ListingWithRelations): string {
  return l.images?.find((i) => i.is_main)?.image_url ?? l.images?.[0]?.image_url ?? PLACEHOLDER_IMAGE;
}

// ── Identité typographique propre à cette page (test) ───────────────────────
const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif'; // display éditorial
const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace'; // registre

// Palette locale (non globale) : papier + encre + bissap (hibiscus) ; le vert
// reste un SIGNAL (frais / vérifié), pas une couleur de fond.
const BISSAP = '#8A1C3B';
const BISSAP_SOFT = '#CE7E95'; // hibiscus clair, lisible sur fond encre
const INK = '#17120C';

// Témoignages — personas de démo, pour la cohérence avec le catalogue.
const FEATURED_VOICE = {
  quote:
    'Avant, mes mangues partaient au rabais ou pourrissaient au champ. Sur AgriLien je fixe mon prix, je vois qui achète, et j’écoule ma récolte auprès de restaurants de Dakar en deux jours.',
  name: 'Awa Diop',
  role: 'Productrice',
  place: 'Ferme des Niayes · Dakar',
  verified: true,
};

const VOICES = [
  {
    quote: 'Je commande mes légumes directement au producteur. Plus frais, moins cher — et je sais exactement d’où ça vient.',
    name: 'Fatou Ndiaye',
    role: 'Acheteuse',
    place: 'Restaurant Teranga · Dakar',
    verified: false,
  },
  {
    quote: 'Le badge vérifié change tout : les acheteurs me font confiance avant même de m’appeler.',
    name: 'Modou Sarr',
    role: 'Producteur',
    place: 'Exploitation du Saloum · Kaolack',
    verified: true,
  },
];

// Les engagements du « pacte » — ensemble fixe (clauses), pas une séquence.
const PACTE = [
  { n: '01', icon: Coins, t: 'Sans commission', d: 'Vous gardez la valeur de votre récolte. AgriLien ne prélève rien sur la vente.' },
  { n: '02', icon: BadgeCheck, t: 'Producteurs vérifiés', d: 'Un cachet « vérifié » après contrôle de l’exploitation par notre équipe.' },
  { n: '03', icon: Route, t: 'Circuit court', d: 'Le producteur et l’acheteur se parlent en direct, sans intermédiaire inutile.' },
  { n: '04', icon: Scale, t: 'Juste prix', d: 'Prix affiché à la source, région par région — et prix officiel rappelé sur les filières régulées.' },
] as const;

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

  const live = !!(recent && recent.length > 0);
  const isSample = !live;

  // Vedette = 1re annonce réelle (photo + étiquette) ; repli sur un exemple clair.
  const featured = live
    ? {
        id: recent![0].id,
        region: recent![0].region,
        title: recent![0].title,
        price: recent![0].price,
        unit: recent![0].unit,
        verified: recent![0].producer?.verification_status === 'verifie',
        image: mainImage(recent![0]),
      }
    : { id: null as string | null, ...SAMPLE[0], image: FALLBACK_HERO_IMG };

  // Le reste alimente la liste « index ».
  const indexRows = live
    ? recent!.slice(1, 6).map((l) => ({
        id: l.id as string | null,
        region: l.region,
        title: l.title,
        price: l.price,
        unit: l.unit,
        verified: l.producer?.verification_status === 'verifie',
      }))
    : SAMPLE.slice(1).map((s) => ({ id: null as string | null, ...s }));

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
              Qui récolte quoi, où, et à{' '}
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

            {/* bandeau de garanties en registre */}
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              {[
                { k: '0%', v: 'Commission' },
                { k: '14', v: 'Régions' },
                { k: '100%', v: 'Local' },
              ].map((s) => (
                <div key={s.v} className="bg-surface px-4 py-4">
                  <dt className="text-2xl text-gray-900" style={{ fontFamily: ED, fontWeight: 700 }}>
                    {s.k}
                  </dt>
                  <dd className="mt-0.5 text-xs uppercase text-gray-500" style={{ fontFamily: MONO, letterSpacing: '0.12em' }}>
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Colonne « index du jour » — ledger des offres réelles */}
          <aside className="hero-reveal relative" style={{ animationDelay: '0.18s' }}>
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft-lg">
              {/* Vedette : vraie photo produit + étiquette kraft */}
              <Link
                to={featured.id ? `/annonce/${featured.id}` : '/catalogue'}
                className="group relative block"
              >
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {isSample && (
                  <span
                    className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur"
                    style={{ fontFamily: MONO, letterSpacing: '0.08em' }}
                  >
                    EXEMPLE
                  </span>
                )}
                <div className="absolute right-4 top-4 rotate-[6deg]">
                  <KraftTag price={featured.price} unit={featured.unit} />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="flex items-center gap-1 text-xs" style={{ fontFamily: MONO, letterSpacing: '0.08em' }}>
                    <MapPin className="h-3.5 w-3.5" /> {featured.region}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold" style={{ fontFamily: ED }}>
                    <span className="truncate">{featured.title}</span>
                    {featured.verified && <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: '#86efac' }} />}
                  </p>
                </div>
              </Link>

              <div className="flex items-center justify-between border-y border-border px-5 py-3.5">
                <span className="text-xs uppercase text-gray-900" style={{ fontFamily: MONO, letterSpacing: '0.18em' }}>
                  L'index du jour
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500" style={{ fontFamily: MONO }}>
                  <RefreshCw className="h-3.5 w-3.5" /> Mis à jour {today}
                </span>
              </div>

              <ul>
                {indexRows.map((r, i) => (
                  <li key={i} className="ah2-row border-b border-border last:border-0">
                    <Link to={r.id ? `/annonce/${r.id}` : '/catalogue'} className="flex items-center gap-3 px-5 py-3.5">
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
              {isSample
                ? 'Offres d’exemple — le catalogue se remplit.'
                : 'Le badge vert indique un producteur vérifié.'}
            </p>
          </aside>
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
            recent.slice(0, 6).map((l) => <EditorialListingCard key={l.id} listing={l} />)
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

      {/* ═══ LE CARNET — découverte des prestataires (transport, mécanisation) ═══ */}
      <section className="border-t border-border">
        <div className="container py-14 lg:py-16">
          <div className="grid items-center gap-8 rounded-3xl border border-border bg-surface p-7 shadow-soft lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <Eyebrow>
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: BISSAP }} />
                Le carnet du marché
              </Eyebrow>
              <h2
                className="mt-4 text-3xl text-gray-900 md:text-4xl"
                style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                Récolter, c'est bien. <span style={{ color: BISSAP }}>L'acheminer, c'est mieux.</span>
              </h2>
              <p className="mt-4 max-w-md text-gray-600">
                Besoin d'un transporteur pour vos sacs, d'un tracteur pour labourer&nbsp;? Le Carnet
                réunit des prestataires vérifiés, région par région. Vous les appelez en direct.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: BISSAP }}
                >
                  Consulter le Carnet <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/services/partenaire"
                  className="text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900"
                >
                  Vous proposez un service&nbsp;?
                </Link>
              </div>
            </div>

            {/* Aperçu : domaines en fiches de registre */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Truck, t: 'Transport', d: 'Récoltes & bétail' },
                { icon: Tractor, t: 'Mécanisation', d: 'Labour, semis, battage' },
              ].map((s) => (
                <Link
                  key={s.t}
                  to="/services"
                  className="group rounded-2xl border border-border bg-[rgb(var(--background))] p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(138,28,59,0.08)', color: BISSAP }}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-semibold text-gray-900" style={{ fontFamily: ED }}>
                    {s.t}
                  </p>
                  <p className="mt-0.5 text-xs uppercase text-gray-500" style={{ fontFamily: MONO, letterSpacing: '0.08em' }}>
                    {s.d}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LE PACTE — bande encre, garanties en registre ═══ */}
      <section style={{ backgroundColor: INK }} className="relative overflow-hidden py-20 lg:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: BISSAP }}
        />
        <div className="container relative">
          <div className="max-w-2xl">
            <Eyebrow>
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: BISSAP_SOFT }} />
              Le pacte AgriLien
            </Eyebrow>
            <h2
              className="mt-4 text-4xl md:text-5xl"
              style={{ fontFamily: ED, fontWeight: 800, color: '#FAF8F3', letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              Quatre engagements,
              <br />
              <span style={{ color: BISSAP_SOFT }}>sans astérisque.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(250,248,243,0.6)' }}>
              Pas de petites lignes : ce qui suit s'applique à chaque transaction, du premier contact
              à la poignée de main.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PACTE.map((p) => (
              <div
                key={p.n}
                className="group relative overflow-hidden rounded-2xl bg-[rgba(250,248,243,0.04)] p-6 transition-colors duration-300 hover:bg-[rgba(250,248,243,0.07)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: BISSAP_SOFT }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(138,28,59,0.22)', color: '#EBA6B8' }}
                  >
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs" style={{ fontFamily: MONO, color: BISSAP_SOFT, letterSpacing: '0.12em' }}>
                    {p.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg" style={{ fontFamily: ED, fontWeight: 600, color: '#FAF8F3' }}>
                  {p.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(250,248,243,0.6)' }}>
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

      {/* ═══ PAROLES DU MARCHÉ — témoignages ═══ */}
      <section className="border-t border-border">
        <div className="container py-16 lg:py-24">
          <Eyebrow>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: BISSAP }} />
            Paroles du marché
          </Eyebrow>
          <h2
            className="mt-4 max-w-2xl text-3xl text-gray-900 md:text-4xl"
            style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            Celles et ceux qui font tourner le marché.
          </h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {/* Citation vedette */}
            <figure className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-soft lg:col-span-2 lg:p-10">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 -top-10 select-none"
                style={{ fontFamily: ED, fontWeight: 800, fontSize: '10rem', lineHeight: 1, color: 'rgba(138,28,59,0.09)' }}
              >
                ”
              </span>
              <blockquote
                className="relative max-w-2xl text-2xl leading-snug text-gray-900 md:text-[1.7rem]"
                style={{ fontFamily: ED, fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                « {FEATURED_VOICE.quote} »
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-primary-700">
                  {initials(FEATURED_VOICE.name)}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                    {FEATURED_VOICE.name}
                    {FEATURED_VOICE.verified && <BadgeCheck className="h-4 w-4" style={{ color: '#16a34a' }} />}
                  </p>
                  <p className="text-xs uppercase text-gray-500" style={{ fontFamily: MONO, letterSpacing: '0.1em' }}>
                    {FEATURED_VOICE.role} · {FEATURED_VOICE.place}
                  </p>
                </div>
              </figcaption>
            </figure>

            {/* Voix d'appui */}
            <div className="flex flex-col gap-6">
              {VOICES.map((v) => (
                <figure key={v.name} className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-soft">
                  <span aria-hidden className="absolute inset-x-6 top-0 h-px" style={{ background: BISSAP }} />
                  <blockquote className="text-base leading-relaxed text-gray-700">« {v.quote} »</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-display text-xs font-bold text-gray-700">
                      {initials(v.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        {v.name}
                        {v.verified && <BadgeCheck className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />}
                      </p>
                      <p className="truncate text-[11px] uppercase text-gray-500" style={{ fontFamily: MONO, letterSpacing: '0.08em' }}>
                        {v.role} · {v.place}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
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

          <Link to="/catalogue" className="group p-9 transition" style={{ backgroundColor: BISSAP }}>
            <span className="inline-flex items-center gap-2 text-xs uppercase" style={{ fontFamily: MONO, letterSpacing: '0.22em', color: 'rgba(250,248,243,0.85)' }}>
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

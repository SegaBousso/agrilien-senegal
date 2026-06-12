import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Handshake,
  Lock,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sprout,
  Star,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { HeroSearch } from '@/components/listings/HeroSearch';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton, EmptyState } from '@/components/ui/States';
import { useRecentListings } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCatalog';
import { formatPrice } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

const ADVANTAGES = [
  {
    icon: TrendingUp,
    title: 'Vendez plus vite',
    text: 'Écoulez vos récoltes rapidement en touchant des milliers d\'acheteurs partout au Sénégal.',
  },
  {
    icon: ShieldCheck,
    title: 'Informations fiables',
    text: 'Quantité, prix, qualité et localisation : des annonces claires et vérifiées.',
  },
  {
    icon: Truck,
    title: 'Circuit court',
    text: 'Connectez directement producteurs et acheteurs, sans intermédiaires inutiles.',
  },
  {
    icon: Users,
    title: 'Pour tous',
    text: 'Particuliers, commerçants, restaurants, coopératives et institutions.',
  },
];

const STEPS = [
  { num: '1', icon: UserPlus, title: 'Créez votre compte', text: 'Inscrivez-vous en tant que producteur ou acheteur en quelques minutes.' },
  { num: '2', icon: Search, title: 'Publiez ou recherchez', text: 'Les producteurs publient leurs récoltes, les acheteurs filtrent et trouvent.' },
  { num: '3', icon: Handshake, title: 'Entrez en contact', text: 'Envoyez une demande d\'achat et finalisez la transaction directement.' },
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Annonces vérifiées',
    text: 'Chaque annonce est contrôlée par notre équipe avant sa publication.',
  },
  {
    icon: BadgeCheck,
    title: 'Producteurs identifiés',
    text: "Nom de l'exploitation, région et commune affichés pour chaque vendeur.",
  },
  {
    icon: Phone,
    title: 'Contact direct',
    text: 'Échangez directement avec le producteur, sans intermédiaire ni commission.',
  },
  {
    icon: Lock,
    title: 'Données protégées',
    text: 'Vos informations restent sécurisées et leur accès est strictement contrôlé.',
  },
];

export default function HomePage() {
  const { data: recent, isLoading } = useRecentListings(6);
  const { data: categories } = useCategories();

  return (
    <>
      <Seo
        title="Accueil"
        description="AgriLien Sénégal connecte producteurs agricoles et acheteurs. Trouvez des produits frais, locaux et de qualité partout au Sénégal."
      />

      {/* HERO — image plein cadre + voile vert */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        {/* Photo de fond (décorative). Le dégradé ci-dessus sert de secours. */}
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80"
          alt=""
          aria-hidden
          fetchPriority="high"
          className="hero-zoom absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        {/* Voiles dégradés : lisibilité du texte à gauche, profondeur en bas */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-900/95 via-primary-900/80 to-primary-900/40"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-900/85 via-transparent to-primary-900/20"
        />
        {/* Vignette pour la profondeur */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_40%,transparent_45%,rgba(8,40,20,0.45))]"
        />
        {/* Texture grain — finition « premium » (subtile) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="container relative py-10 md:py-12 lg:py-14">
          <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Colonne contenu */}
            <div className="max-w-2xl">
              <span
                className="hero-reveal mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur"
                style={{ animationDelay: '0.05s' }}
              >
                <Sprout className="h-4 w-4 text-accent-300" /> Agriculture sénégalaise connectée
              </span>
              <h1
                className="hero-reveal text-balance text-4xl font-extrabold leading-[1.05] tracking-tight [text-shadow:0_2px_20px_rgba(0,0,0,0.25)] md:text-5xl lg:text-6xl"
                style={{ animationDelay: '0.12s' }}
              >
                Tout le marché agricole du Sénégal,{' '}
                <span className="text-accent-400">réuni en un seul endroit.</span>
              </h1>
              <p
                className="hero-reveal mt-5 max-w-xl text-pretty text-lg text-primary-50/90 md:text-xl"
                style={{ animationDelay: '0.2s' }}
              >
                AgriLien relie producteurs et acheteurs pour réduire les pertes de récoltes et
                garantir des produits frais, locaux et au juste prix.
              </p>

              {/* Recherche = CTA principal (modèle marketplace) */}
              <div className="hero-reveal mt-8" style={{ animationDelay: '0.28s' }}>
                <HeroSearch />
              </div>

              {/* Suggestions de recherche populaires */}
              {categories && categories.length > 0 && (
                <div
                  className="hero-reveal mt-4 flex flex-wrap items-center gap-2 text-sm text-primary-50"
                  style={{ animationDelay: '0.36s' }}
                >
                  <span className="opacity-80">Populaire :</span>
                  {categories.slice(0, 4).map((c) => (
                    <Link
                      key={c.id}
                      to={`/catalogue?categorie=${c.id}`}
                      className="rounded-full bg-white/15 px-3 py-1 font-medium ring-1 ring-white/15 backdrop-blur transition hover:bg-white/25"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Preuve sociale : cluster d'avatars + lien producteur */}
              <div
                className="hero-reveal mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
                style={{ animationDelay: '0.44s' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5" aria-hidden>
                    {['bg-accent-400 text-primary-900', 'bg-primary-400 text-primary-900', 'bg-amber-300 text-primary-900', 'bg-emerald-300 text-primary-900'].map(
                      (cls, i) => (
                        <span
                          key={i}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary-900 text-xs font-bold ${cls}`}
                        >
                          {['AD', 'MS', 'FN', 'OB'][i]}
                        </span>
                      ),
                    )}
                  </div>
                  <div>
                    <div className="flex gap-0.5" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                      ))}
                    </div>
                    <p className="mt-0.5 text-sm text-primary-50/90">
                      Producteurs &amp; acheteurs de tout le Sénégal
                    </p>
                  </div>
                </div>
                <Link
                  to="/inscription"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition hover:text-accent-200"
                >
                  Vous êtes producteur ? Publiez vos récoltes <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Carte « à la une » — vraie annonce récente (desktop large) */}
            {recent && recent[0] && (
              <aside
                className="hero-reveal hidden xl:block"
                style={{ animationDelay: '0.5s' }}
                aria-label="Annonce à la une"
              >
                <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-soft-lg backdrop-blur-md">
                  <div className="flex items-center gap-1.5 px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-accent-300">
                    <Star className="h-3.5 w-3.5 fill-accent-300" /> À la une
                  </div>
                  <div className="mt-2 px-3">
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={
                          recent[0].images?.find((i) => i.is_main)?.image_url ??
                          recent[0].images?.[0]?.image_url ??
                          PLACEHOLDER_IMAGE
                        }
                        alt={recent[0].title}
                        loading="lazy"
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <h3 className="truncate font-display font-semibold text-white">{recent[0].title}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-primary-50/80">
                      <MapPin className="h-3.5 w-3.5" /> {recent[0].region}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-lg font-bold text-white">
                        {formatPrice(recent[0].price)}
                        <span className="text-xs font-normal text-primary-50/70">/{recent[0].unit}</span>
                      </span>
                      <Link
                        to={`/annonce/${recent[0].id}`}
                        className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 transition hover:bg-white/30"
                      >
                        Voir l'offre
                      </Link>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Bande de métriques (preuve sociale) */}
        <div className="relative border-t border-white/15 bg-primary-900/40 backdrop-blur-sm">
          <div className="container flex flex-wrap items-center gap-x-10 gap-y-5 py-5">
            {[
              { value: '14', label: 'Régions couvertes' },
              { value: '100%', label: 'Produits locaux' },
              { value: '0', label: 'Commission' },
              { value: '24/7', label: 'Accessible' },
            ].map((m) => (
              <div key={m.label}>
                <p className="font-display text-2xl font-extrabold leading-none text-white md:text-3xl">
                  {m.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-primary-50/70">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">Pourquoi AgriLien&nbsp;?</h2>
          <p className="mt-3 text-gray-600">
            Une solution pensée pour les réalités de l'agriculture sénégalaise.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a) => (
            <div key={a.title} className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <a.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{a.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATÉGORIES */}
      {categories && categories.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container">
            <h2 className="text-2xl font-bold text-gray-900">Catégories populaires</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/catalogue?categorie=${c.id}`}
                  className="rounded-full border border-gray-200 bg-surface px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRODUITS RÉCENTS */}
      <section className="container py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Annonces récentes</h2>
            <p className="mt-2 text-gray-600">Les dernières récoltes disponibles sur la plateforme.</p>
          </div>
          <Link to="/catalogue" className="hidden items-center gap-1 text-sm font-semibold text-primary-700 hover:underline sm:inline-flex">
            Tout voir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
          ) : recent && recent.length > 0 ? (
            recent.map((l) => <ListingCard key={l.id} listing={l} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title="Aucune annonce pour le moment"
                description="Les premières récoltes seront bientôt publiées. Revenez vite !"
                action={
                  <Link to="/inscription">
                    <Button>Publier une annonce</Button>
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE — stepper connecté */}
      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
              En 3 étapes
            </span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Comment ça marche&nbsp;?</h2>
            <p className="mt-3 text-gray-600">Trois étapes simples pour vendre ou acheter.</p>
          </div>

          <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            {/* Ligne de connexion (desktop uniquement) */}
            <div
              aria-hidden
              className="absolute left-[16.666%] right-[16.666%] top-7 hidden h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 md:block"
            />

            {STEPS.map((s) => (
              <li key={s.num} className="group relative flex flex-col items-center text-center">
                {/* Nœud numéroté sur la ligne */}
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 font-display text-xl font-bold text-white shadow-soft ring-4 ring-gray-50 transition-transform duration-200 group-hover:scale-105">
                  {s.num}
                </span>

                {/* Carte */}
                <div className="mt-6 w-full rounded-2xl border border-border bg-surface p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 text-center">
            <Link to="/inscription">
              <Button size="lg">
                Commencer maintenant <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CONFIANCE & SÉCURITÉ */}
      <section className="container py-16">
        <div className="grid gap-10 rounded-3xl border border-border bg-surface p-8 shadow-soft md:grid-cols-2 md:p-12">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
              <ShieldCheck className="h-4 w-4" /> Confiance &amp; sécurité
            </span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Acheter et vendre en toute confiance
            </h2>
            <p className="mt-3 text-gray-600">
              AgriLien protège producteurs et acheteurs à chaque étape. Des annonces fiables, des
              vendeurs identifiés et un contact direct — pour des transactions sereines.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <p className="text-sm text-gray-700">
                <strong className="font-semibold text-gray-900">100 % des annonces</strong> sont
                modérées avant d'apparaître au catalogue.
              </p>
            </div>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {TRUST_POINTS.map((point) => (
              <li key={point.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <point.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{point.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-14 text-center text-white md:px-16">
          <h2 className="text-3xl font-bold">Prêt à rejoindre AgriLien&nbsp;?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-50">
            Inscrivez-vous gratuitement et commencez à vendre ou acheter des produits agricoles dès
            aujourd'hui.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/inscription">
              <Button size="lg" variant="accent" className="w-full sm:w-auto">
                Créer mon compte gratuit
              </Button>
            </Link>
          </div>
          <ul className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-50">
            {['Inscription gratuite', 'Sans commission', 'Support en français'].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent-300" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

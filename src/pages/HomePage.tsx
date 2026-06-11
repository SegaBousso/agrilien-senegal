import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Handshake,
  MapPin,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { HeroSearch } from '@/components/listings/HeroSearch';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCardSkeleton, EmptyState } from '@/components/ui/States';
import { useRecentListings } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCatalog';

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
  { num: '1', title: 'Créez votre compte', text: 'Inscrivez-vous en tant que producteur ou acheteur en quelques minutes.' },
  { num: '2', title: 'Publiez ou recherchez', text: 'Les producteurs publient leurs récoltes, les acheteurs filtrent et trouvent.' },
  { num: '3', title: 'Entrez en contact', text: 'Envoyez une demande d\'achat et finalisez la transaction directement.' },
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
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        {/* Voiles dégradés : lisibilité du texte à gauche, profondeur en bas */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-900/95 via-primary-900/80 to-primary-900/40"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-900/80 via-transparent to-transparent"
        />

        <div className="container relative py-20 md:py-28 lg:py-32">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <Sprout className="h-4 w-4 text-accent-300" /> Agriculture sénégalaise connectée
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] drop-shadow-sm md:text-5xl lg:text-6xl">
              Le marché agricole du Sénégal, <span className="text-accent-400">en un clic</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-50/90 md:text-xl">
              AgriLien relie les producteurs aux acheteurs pour réduire les pertes de récoltes et
              garantir des produits frais, locaux et au juste prix.
            </p>

            {/* Recherche = CTA principal (modèle marketplace) */}
            <div className="mt-8">
              <HeroSearch />
            </div>

            {/* Suggestions de recherche populaires */}
            {categories && categories.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-primary-50">
                <span className="opacity-80">Populaire :</span>
                {categories.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalogue?categorie=${c.id}`}
                    className="rounded-full bg-white/15 px-3 py-1 font-medium backdrop-blur transition hover:bg-white/25"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/inscription"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 hover:text-accent-200"
            >
              Vous êtes producteur ? Publiez vos récoltes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Bande de stats (preuve sociale) */}
        <div className="relative border-t border-white/15 bg-primary-900/40 backdrop-blur-sm">
          <div className="container flex flex-wrap items-center gap-x-8 gap-y-3 py-4 text-sm font-medium text-primary-50">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent-300" /> 14 régions couvertes
            </span>
            <span className="inline-flex items-center gap-2">
              <Sprout className="h-4 w-4 text-accent-300" /> 100 % produits locaux
            </span>
            <span className="inline-flex items-center gap-2">
              <Handshake className="h-4 w-4 text-accent-300" /> 0 intermédiaire
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-300" /> Accessible 24/7
            </span>
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

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-gray-50 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900">Comment ça marche&nbsp;?</h2>
            <p className="mt-3 text-gray-600">Trois étapes simples pour vendre ou acheter.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="relative rounded-2xl bg-surface p-8 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                  {s.num}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
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

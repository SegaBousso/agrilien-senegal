import { Link } from 'react-router-dom';
import { HeartHandshake, Leaf, Target, TrendingUp } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';

const VALUES = [
  { icon: Target, title: 'Notre mission', text: 'Réduire les pertes post-récolte en connectant directement producteurs et acheteurs.' },
  { icon: Leaf, title: 'Produits locaux', text: 'Valoriser l\'agriculture sénégalaise et les circuits courts de proximité.' },
  { icon: HeartHandshake, title: 'Confiance', text: 'Des informations fiables et transparentes pour des transactions sereines.' },
  { icon: TrendingUp, title: 'Impact', text: 'Soutenir les revenus des producteurs et l\'accès à des produits frais.' },
];

export default function AboutPage() {
  return (
    <>
      <Seo title="À propos" description="Découvrez la mission d'AgriLien Sénégal : connecter producteurs et acheteurs pour une agriculture durable." />

      <section className="bg-gradient-to-br from-primary-700 to-primary-800 py-16 text-white">
        <div className="container max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold">À propos d'AgriLien</h1>
          <p className="mt-4 text-lg text-primary-50">
            AgriLien Sénégal est née d'un constat simple : trop de récoltes sont perdues faute
            d'acheteurs, tandis que les acheteurs peinent à trouver des produits frais et locaux.
            Notre plateforme résout ce problème en créant un lien direct, simple et fiable.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <v.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-semibold text-gray-900">{v.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container max-w-3xl space-y-6 text-gray-700">
          <h2 className="text-2xl font-bold text-gray-900">Le problème que nous résolvons</h2>
          <p>
            Au Sénégal, une part importante des récoltes est perdue chaque année par manque de
            débouchés rapides. Les producteurs, souvent isolés, manquent de canaux pour écouler
            leurs produits au bon moment et au juste prix.
          </p>
          <p>
            Du côté des acheteurs — particuliers, commerçants, restaurants, coopératives ou
            institutions — il est difficile de trouver des produits frais et locaux avec des
            informations fiables sur la quantité, le prix, la qualité et la localisation.
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Notre solution</h2>
          <p>
            AgriLien centralise les offres agricoles dans un catalogue moderne, accessible depuis un
            simple téléphone. Les producteurs publient leurs annonces en quelques minutes ; les
            acheteurs recherchent, filtrent et entrent directement en contact. Simple, rapide,
            transparent.
          </p>
        </div>
      </section>

      <section className="container py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Rejoignez le mouvement</h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Producteur ou acheteur, AgriLien est fait pour vous.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/inscription">
            <Button size="lg">Créer un compte</Button>
          </Link>
          <Link to="/catalogue">
            <Button size="lg" variant="outline">
              Voir le catalogue
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

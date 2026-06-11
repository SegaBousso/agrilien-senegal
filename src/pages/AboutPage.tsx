import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Leaf,
  MapPin,
  Quote,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';

const VALUES = [
  { icon: Target, title: 'Notre mission', text: 'Réduire les pertes post-récolte en connectant directement producteurs et acheteurs.' },
  { icon: Leaf, title: 'Produits locaux', text: "Valoriser l'agriculture sénégalaise et les circuits courts de proximité." },
  { icon: HeartHandshake, title: 'Confiance', text: 'Des informations fiables et transparentes pour des transactions sereines.' },
  { icon: TrendingUp, title: 'Impact', text: "Soutenir les revenus des producteurs et l'accès à des produits frais." },
];

const STATS = [
  { value: '14', label: 'régions couvertes' },
  { value: '0', label: 'commission prélevée' },
  { value: '100%', label: 'produits locaux' },
  { value: '24/7', label: 'plateforme accessible' },
];

export default function AboutPage() {
  return (
    <>
      <Seo title="À propos" description="Découvrez la mission d'AgriLien Sénégal : connecter producteurs et acheteurs pour une agriculture durable." />

      {/* HERO — split éditorial */}
      <section className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            <Sprout className="h-3.5 w-3.5" /> Notre histoire
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] text-gray-900 md:text-5xl">
            Relier la terre <span className="text-primary-600">au marché</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            AgriLien Sénégal est née d'un constat simple : trop de récoltes sont perdues faute
            d'acheteurs, tandis que les acheteurs peinent à trouver des produits frais et locaux.
            Nous créons un lien direct, simple et fiable entre les deux.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/inscription">
              <Button size="lg">
                Rejoindre AgriLien <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/catalogue">
              <Button size="lg" variant="outline">
                Voir le catalogue
              </Button>
            </Link>
          </div>
        </div>

        {/* Visuel + badge flottant */}
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-primary-100 shadow-soft-lg">
            <img
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80"
              alt="Produits agricoles frais d'un marché sénégalais"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <MapPin className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-gray-900">
              Présent dans les 14 régions
              <span className="block text-xs font-normal text-gray-500">du Sénégal</span>
            </p>
          </div>
        </div>
      </section>

      {/* MANIFESTE */}
      <section className="bg-gray-50 py-16">
        <div className="container max-w-3xl text-center">
          <Quote className="mx-auto h-10 w-10 text-primary-300" />
          <p className="mt-4 font-display text-2xl font-semibold leading-snug text-gray-900 md:text-3xl">
            « Chaque récolte mérite un acheteur, chaque acheteur mérite des produits frais et
            locaux. »
          </p>
        </div>
      </section>

      {/* VALEURS */}
      <section className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ce qui nous guide</h2>
          <p className="mt-3 text-gray-600">Quatre principes au cœur de chaque décision.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white">
                <v.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{v.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLÈME ↔ SOLUTION */}
      <section className="bg-gray-50 py-16">
        <div className="container grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-red-100 bg-surface p-8 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <TrendingDown className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Le problème</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Au Sénégal, une part importante des récoltes est perdue chaque année par manque de
              débouchés rapides. Les producteurs, souvent isolés, manquent de canaux pour écouler
              leurs produits au bon moment. Côté acheteurs, il est difficile de trouver des produits
              frais et locaux avec des informations fiables.
            </p>
          </div>
          <div className="rounded-2xl border border-primary-100 bg-surface p-8 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Notre solution</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              AgriLien centralise les offres agricoles dans un catalogue moderne, accessible depuis
              un simple téléphone. Les producteurs publient leurs annonces en quelques minutes ; les
              acheteurs recherchent, filtrent et entrent directement en contact. Simple, rapide,
              transparent.
            </p>
          </div>
        </div>
      </section>

      {/* IMPACT — bande chiffrée */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 py-14 text-white">
        <div className="container grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-extrabold text-accent-400 md:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-primary-50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="overflow-hidden rounded-3xl border border-border bg-surface px-8 py-14 text-center shadow-soft md:px-16">
          <h2 className="text-3xl font-bold text-gray-900">Rejoignez le mouvement</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Producteur ou acheteur, AgriLien est fait pour vous. L'inscription est gratuite et sans
            commission.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/inscription">
              <Button size="lg">Créer un compte gratuit</Button>
            </Link>
            <Link to="/catalogue">
              <Button size="lg" variant="outline">
                Explorer le catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

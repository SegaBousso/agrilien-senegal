import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { AltNavbar } from '@/components/layout/AltNavbar';
import { Button } from '@/components/ui/Button';

/**
 * Page de comparaison (test) : présente la navbar ALTERNATIVE (barre flottante
 * en pilule) en situation, pour la confronter à la navbar standard du site.
 */
export default function NavTestPage() {
  return (
    <div className="min-h-dvh bg-background">
      <Seo title="Navigation — test" />
      <AltNavbar />

      <main className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            <Sparkles className="h-3.5 w-3.5" /> Navigation alternative
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Barre flottante « pilule »
          </h1>
          <p className="mt-3 text-gray-600">
            Une barre détachée du bord, en verre dépoli, avec les liens centrés et un état actif
            plein. Faites défiler la page : elle reste accrochée en haut. Comparez-la à la navbar
            standard du site.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" /> Voir la navbar standard
              </Button>
            </Link>
            <Link to="/accueil-2">
              <Button variant="ghost">Voir la page d'accueil test</Button>
            </Link>
          </div>
        </div>

        {/* Différences clés */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { t: 'Flottante', d: 'Détachée du bord, coins arrondis, ombre douce — un objet posé sur la page.' },
            { t: 'Liens centrés', d: 'Navigation au centre, état actif en pilule pleine plutôt qu’un simple texte coloré.' },
            { t: 'Verre dépoli', d: 'Fond translucide et flou : le contenu transparaît subtilement au défilement.' },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <h3 className="font-display font-semibold text-gray-900">{c.t}</h3>
              <p className="mt-1.5 text-sm text-gray-600">{c.d}</p>
            </div>
          ))}
        </div>

        {/* Contenu de remplissage pour tester le défilement sticky */}
        <div className="mx-auto mt-14 max-w-2xl space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-3 h-2.5 w-full rounded bg-gray-100" />
              <div className="mt-2 h-2.5 w-4/5 rounded bg-gray-100" />
              <div className="mt-2 h-2.5 w-2/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

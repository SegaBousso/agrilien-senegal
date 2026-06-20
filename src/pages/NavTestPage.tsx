import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { MarketRegisterNavbar } from '@/components/layout/MarketRegisterNavbar';
import { Button } from '@/components/ui/Button';

/**
 * Page de comparaison (test) : présente la navbar ALTERNATIVE (« masthead de
 * registre » : dateline date·région·météo + libellés mono), à confronter à la
 * navbar standard du site. Faites défiler : la dateline se replie.
 */
export default function NavTestPage() {
  return (
    <div className="min-h-dvh bg-background">
      <Seo title="Navigation — test" />
      <MarketRegisterNavbar />

      <main className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            <Sparkles className="h-3.5 w-3.5" /> Navigation alternative
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Masthead de registre
          </h1>
          <p className="mt-3 text-gray-600">
            Une nav qui se comporte comme la « une » d'un registre de marché : un bandeau dateline
            (date · votre région · météo en direct) au-dessus d'une barre aux libellés mono, l'onglet
            actif souligné en bissap. Faites défiler : la dateline se replie et la région passe dans
            la barre.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" /> Aller au site
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost">Voir la page d'accueil</Button>
            </Link>
          </div>
        </div>

        {/* Différences clés */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { t: 'Dateline vivante', d: 'Date du jour, votre région et sa météo en direct — la nav connaît le lieu, comme un almanach.' },
            { t: 'Libellés « registre »', d: 'Navigation en police mono, onglet actif souligné d’un tiret bissap, telle une coche de registre.' },
            { t: 'Se replie au défilement', d: 'La dateline se rétracte ; la région·température glisse dans la barre principale.' },
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

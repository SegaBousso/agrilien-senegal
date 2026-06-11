import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

const BULLETS = [
  'Annonces vérifiées avant publication',
  'Contact direct avec les producteurs',
  'Inscription gratuite, sans commission',
];

/**
 * Coquille d'authentification en split : panneau de marque (visuel) à gauche,
 * contenu du formulaire à droite. Partagée par Connexion et Inscription.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container py-10 lg:py-16">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface shadow-soft-lg md:grid-cols-2">
        {/* Panneau de marque (desktop) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary-800 p-9 text-white md:flex">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-800/85 to-primary-900/95"
          />

          <Logo white />

          <div>
            <h2 className="font-display text-2xl font-bold leading-snug">
              Le marché agricole du Sénégal, à portée de main.
            </h2>
            <ul className="mt-6 space-y-3">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-primary-50">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-300" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-primary-50/70">© {new Date().getFullYear()} AgriLien Sénégal</p>
        </aside>

        {/* Côté formulaire */}
        <div className="p-7 sm:p-9">
          <div className="mb-6 md:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/utils';
import type { UserRole } from '@/types/database';

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
];

const DASHBOARD_PATH: Record<UserRole, string> = {
  producer: '/producteur/dashboard',
  buyer: '/acheteur/dashboard',
  admin: '/admin/dashboard',
  visitor: '/',
};

/**
 * Navbar alternative (test) : barre flottante en « pilule » verre dépoli,
 * détachée du bord, liens centrés avec état actif plein. À comparer avec la
 * navbar standard.
 */
export function AltNavbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = profile ? DASHBOARD_PATH[profile.role] : '/';

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border border-border bg-surface/80 py-2 pl-4 pr-2 shadow-lg backdrop-blur-md">
        <Logo />

        {/* Liens centrés — état actif en pilule pleine */}
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-muted hover:text-gray-900',
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {session && profile && <NotificationBell />}
          {session && profile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 transition hover:ring-2 hover:ring-primary-200"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Mon compte"
              >
                {initials(profile.full_name)}
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-lg"
                  role="menu"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-muted"
                    role="menuitem"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Tableau de bord
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/connexion">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link to="/inscription">
                <Button size="sm" className="rounded-full">
                  S'inscrire
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          {session && profile && <NotificationBell />}
          <ThemeToggle />
          <button
            className="rounded-full p-2 text-gray-700 hover:bg-muted"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Panneau mobile flottant */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-border bg-surface p-2 shadow-lg md:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-4 py-2.5 text-sm font-medium',
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-muted',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-border p-2">
              {session && profile ? (
                <>
                  <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Tableau de bord
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/connexion" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/inscription" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">S'inscrire</Button>
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

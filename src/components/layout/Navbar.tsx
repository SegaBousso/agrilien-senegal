import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/database';

const PUBLIC_LINKS = [
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

export function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardPath = profile ? DASHBOARD_PATH[profile.role] : '/';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-surface/90 backdrop-blur">
      <nav className="container flex h-16 items-center justify-between">
        <Logo />

        {/* Liens desktop */}
        <ul className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-primary-700' : 'text-gray-600 hover:text-primary-700',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Actions desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {session && profile && <NotificationBell />}
          {session && profile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 hover:bg-gray-50"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {initials(profile.full_name)}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium text-gray-700">
                  {profile.full_name}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-surface py-1 shadow-lg"
                  role="menu"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <MenuLink to={dashboardPath} icon={LayoutDashboard} label="Tableau de bord" onClick={() => setMenuOpen(false)} />
                  {profile.role === 'buyer' && (
                    <MenuLink to="/acheteur/favoris" icon={Heart} label="Mes favoris" onClick={() => setMenuOpen(false)} />
                  )}
                  <MenuLink to={dashboardPath} icon={User} label={roleLabel(profile.role)} onClick={() => setMenuOpen(false)} />
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
                <Button size="sm">S'inscrire</Button>
              </Link>
            </>
          )}
        </div>

        {/* Actions mobile */}
        <div className="flex items-center gap-1 md:hidden">
          {session && profile && <NotificationBell />}
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-gray-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-surface md:hidden">
          <ul className="container flex flex-col py-2">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
              {session && profile ? (
                <>
                  <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Tableau de bord
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleSignOut} className="w-full">
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

function MenuLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof LogOut;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
      role="menuitem"
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function roleLabel(role: UserRole): string {
  return role === 'producer' ? 'Espace producteur' : role === 'admin' ? 'Administration' : 'Espace acheteur';
}

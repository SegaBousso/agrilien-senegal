import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Leaf, LogOut, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useUserRegion, useWeather } from '@/hooks/useWeather';
import { cn, initials } from '@/lib/utils';
import type { UserRole } from '@/types/database';

const MONO = '"Spline Sans Mono", ui-monospace, SFMono-Regular, monospace';
const BISSAP = '#8A1C3B';
const BISSAP_LIGHT = '#CE7E95';
const INK = '#17120C';
const PAPER = '#FAF8F3';

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/services', label: 'Services' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
];

const DASHBOARD_PATH: Record<UserRole, string> = {
  producer: '/producteur/dashboard',
  buyer: '/acheteur/dashboard',
  admin: '/admin/dashboard',
  visitor: '/',
};

const DATELINE_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/** Chip région + température en direct (réutilise la météo géolocalisée). */
function TerroirChip({ region, temp }: { region: string; temp?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{ fontFamily: MONO, letterSpacing: '0.08em' }}
    >
      <Leaf className="h-3.5 w-3.5" style={{ color: '#86efac' }} />
      {region.toUpperCase()}
      {typeof temp === 'number' && <span style={{ color: BISSAP_LIGHT }}>{temp}°</span>}
    </span>
  );
}

/**
 * Navbar « masthead de registre » : un bandeau dateline (date · région · météo
 * en direct) au-dessus d'une barre principale aux libellés mono ; le lien actif
 * porte une coche bissap. La dateline se replie au défilement.
 */
export function MarketRegisterNavbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const userRegion = useUserRegion();
  const region = userRegion ?? 'Dakar';
  const { data: weather } = useWeather(region);

  const dashboardPath = profile ? DASHBOARD_PATH[profile.role] : '/';
  const today = DATELINE_FMT.format(new Date()).replace('.', '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40">
      {/* ── Dateline (masthead) — se replie au défilement ── */}
      <div
        aria-hidden={scrolled}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100',
        )}
        style={{ backgroundColor: INK, color: PAPER }}
      >
        <div className="container flex h-9 items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-2" style={{ fontFamily: MONO, letterSpacing: '0.14em', color: 'rgba(250,248,243,0.7)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: '#86efac' }} />
            MARCHÉ AGRICOLE DU SÉNÉGAL
          </span>
          <span className="inline-flex items-center gap-2" style={{ fontFamily: MONO, letterSpacing: '0.1em', color: 'rgba(250,248,243,0.85)' }}>
            <span className="hidden uppercase sm:inline">{today}</span>
            <span className="hidden text-white/30 sm:inline">·</span>
            <TerroirChip region={region} temp={weather?.temp} />
          </span>
        </div>
      </div>

      {/* ── Barre principale ── */}
      <div className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Logo />

          {/* Index de navigation — libellés mono, coche bissap sur l'actif */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} end={l.to === '/'} className="group relative block py-1">
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'text-[13px] uppercase transition-colors',
                            isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900',
                          )}
                          style={{ fontFamily: MONO, letterSpacing: '0.14em' }}
                        >
                          {l.label}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            'absolute -bottom-0.5 left-0 h-[2px] origin-left transition-transform duration-300',
                            isActive ? 'w-full scale-x-100' : 'w-full scale-x-0 group-hover:scale-x-100',
                          )}
                          style={{ background: BISSAP }}
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Région compacte quand la dateline est repliée */}
            <span
              className={cn(
                'text-[11px] text-gray-500 transition-opacity duration-200',
                scrolled ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <TerroirChip region={region} temp={weather?.temp} />
            </span>

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
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
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
              <div className="flex items-center gap-1.5">
                <Link
                  to="/connexion"
                  className="px-3 py-2 text-[13px] uppercase text-gray-600 transition-colors hover:text-gray-900"
                  style={{ fontFamily: MONO, letterSpacing: '0.1em' }}
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: BISSAP }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#73152f')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BISSAP)}
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-1 md:hidden">
            {session && profile && <NotificationBell />}
            <ThemeToggle />
            <button
              className="rounded-lg p-2 text-gray-700 hover:bg-muted"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Panneau mobile */}
      {mobileOpen && (
        <div className="border-b border-border bg-surface md:hidden">
          <ul className="container flex flex-col py-2">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block px-2 py-2.5 text-[13px] uppercase',
                      isActive ? 'text-gray-900' : 'text-gray-500',
                    )
                  }
                  style={{ fontFamily: MONO, letterSpacing: '0.14em' }}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {session && profile ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-gray-800"
                  >
                    Tableau de bord
                  </Link>
                  <button onClick={handleSignOut} className="px-4 py-2.5 text-sm text-red-600">
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-gray-800"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/inscription"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
                    style={{ backgroundColor: BISSAP }}
                  >
                    S'inscrire
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

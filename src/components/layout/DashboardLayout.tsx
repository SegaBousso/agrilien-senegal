import { useState, type ComponentType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  CreditCard,
  FolderTree,
  Heart,
  IdCard,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Menu,
  PlusCircle,
  Send,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { MarketRegisterNavbar } from './MarketRegisterNavbar';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types/database';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV: Record<Exclude<UserRole, 'visitor'>, NavItem[]> = {
  producer: [
    { to: '/producteur/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/producteur/annonces', label: 'Mes annonces', icon: ListChecks },
    { to: '/producteur/annonce/nouvelle', label: 'Nouvelle annonce', icon: PlusCircle },
    { to: '/producteur/demandes', label: 'Demandes reçues', icon: Inbox },
  ],
  buyer: [
    { to: '/acheteur/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/acheteur/favoris', label: 'Mes favoris', icon: Heart },
    { to: '/acheteur/demandes', label: 'Mes demandes', icon: Send },
    { to: '/catalogue', label: 'Parcourir le catalogue', icon: ShoppingBag },
  ],
  prestataire: [
    { to: '/prestataire/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/prestataire/profil', label: 'Ma fiche', icon: IdCard },
    { to: '/services', label: 'Voir le carnet', icon: BookOpen },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/admin/annonces', label: 'Modération annonces', icon: ListChecks },
    { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
    { to: '/admin/verifications', label: 'Vérifications', icon: BadgeCheck },
    { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
    { to: '/admin/prix-officiels', label: 'Prix officiels', icon: Landmark },
    { to: '/admin/services', label: 'Catalogue services', icon: Wrench },
    { to: '/admin/prestataires', label: 'Prestataires', icon: Truck },
    { to: '/admin/forfaits', label: 'Forfaits Partenaire', icon: CreditCard },
    { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  ],
};

const TITLES: Record<Exclude<UserRole, 'visitor'>, string> = {
  producer: 'Espace producteur',
  buyer: 'Espace acheteur',
  prestataire: 'Espace prestataire',
  admin: 'Administration',
};

export function DashboardLayout() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const role = (profile?.role ?? 'buyer') as Exclude<UserRole, 'visitor'>;
  const items = NAV[role] ?? NAV.buyer;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <MarketRegisterNavbar />
      <div className="container flex flex-1 gap-6 py-6">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 transform flex-col border-r border-border bg-surface p-4 transition-transform lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:self-start lg:rounded-2xl lg:border lg:shadow-soft',
            'lg:sticky lg:top-6',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* Carte utilisateur */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-primary-700">
              {initials(profile?.full_name ?? 'Ag')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {profile?.full_name ?? 'Mon compte'}
              </p>
              <p className="truncate text-xs text-gray-500">{TITLES[role]}</p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-700 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Menu
          </p>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'text-gray-600 hover:bg-muted hover:text-gray-900',
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {open && (
          <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-gray-700 shadow-sm lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" /> Menu
          </button>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import { useState, type ComponentType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  FolderTree,
  Heart,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Menu,
  PlusCircle,
  Send,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';
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
  admin: [
    { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/admin/annonces', label: 'Modération annonces', icon: ListChecks },
    { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
    { to: '/admin/categories', label: 'Catégories', icon: FolderTree },
    { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  ],
};

const TITLES: Record<Exclude<UserRole, 'visitor'>, string> = {
  producer: 'Espace producteur',
  buyer: 'Espace acheteur',
  admin: 'Administration',
};

export function DashboardLayout() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const role = (profile?.role ?? 'buyer') as Exclude<UserRole, 'visitor'>;
  const items = NAV[role] ?? NAV.buyer;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <div className="container flex flex-1 gap-6 py-6">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 shrink-0 transform border-r border-gray-100 bg-surface p-4 transition-transform lg:static lg:z-0 lg:translate-x-0 lg:rounded-2xl lg:border lg:shadow-sm',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {TITLES[role]}
            </p>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
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
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm font-medium text-gray-700 lg:hidden"
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, Landmark, PackageCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner, EmptyState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import {
  useNotificationsPage,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/useNotifications';
import { cn, formatRelative } from '@/lib/utils';
import type { Notification, UserRole } from '@/types/database';

const PAGE_SIZE = 20;

function iconFor(type: string) {
  switch (type) {
    case 'purchase_request':
      return Inbox;
    case 'request_status':
    case 'payment_confirmed':
    case 'payment_received':
      return PackageCheck;
    case 'refund_needed':
      return Landmark;
    case 'verification':
      return ShieldCheck;
    default:
      return MessageSquare;
  }
}

/** Destination utile au clic, selon le type et le rôle. */
function linkFor(type: string, role: UserRole | undefined): string {
  if (role === 'producer') {
    return type === 'purchase_request' || type === 'payment_received'
      ? '/producteur/demandes'
      : '/producteur/dashboard';
  }
  if (role === 'buyer') {
    return type === 'request_status' || type === 'payment_confirmed' || type === 'refund_needed'
      ? '/acheteur/demandes'
      : '/acheteur/dashboard';
  }
  if (role === 'admin') return '/admin/dashboard';
  return '/';
}

export default function NotificationsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading } = useNotificationsPage(profile?.id, page, unreadOnly);
  const markRead = useMarkNotificationRead(profile?.id);
  const markAll = useMarkAllNotificationsRead(profile?.id);

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const hasUnread = items.some((n) => !n.is_read);

  const open = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
    navigate(linkFor(n.type, profile?.role));
  };

  const switchFilter = (next: boolean) => {
    setUnreadOnly(next);
    setPage(1);
  };

  return (
    <div className="container max-w-3xl py-10">
      <Seo title="Notifications" />

      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Demandes, paiements et mises à jour de votre compte.</p>
          </div>
        </div>
        {hasUnread && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
          </button>
        )}
      </header>

      {/* Filtre */}
      <div className="mt-6 flex gap-2">
        {[
          { v: false, label: 'Toutes' },
          { v: true, label: 'Non lues' },
        ].map((f) => (
          <button
            key={f.label}
            onClick={() => switchFilter(f.v)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              unreadOnly === f.v ? 'bg-primary-600 text-white' : 'bg-muted text-gray-600 hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            title={unreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}
            description={
              unreadOnly
                ? 'Vous êtes à jour. 🎉'
                : 'Vos notifications (demandes, paiements…) apparaîtront ici.'
            }
          />
        ) : (
          <>
            <ul className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
              {items.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <li key={n.id} className="border-b border-border last:border-0">
                    <button
                      onClick={() => open(n)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted',
                        !n.is_read && 'bg-primary-50/40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          n.is_read ? 'bg-gray-100 text-gray-500' : 'bg-primary-100 text-primary-700',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm leading-snug',
                            n.is_read ? 'text-gray-600' : 'font-medium text-gray-900',
                          )}
                        >
                          {n.message}
                        </span>
                        <span className="mt-1 block text-xs text-gray-400">{formatRelative(n.created_at)}</span>
                      </span>
                      {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck, Inbox, PackageCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/useNotifications';
import { cn, formatRelative } from '@/lib/utils';
import type { Notification } from '@/types/database';

/** Icône associée au type de notification. */
function iconFor(type: string) {
  switch (type) {
    case 'purchase_request':
      return Inbox;
    case 'request_status':
      return PackageCheck;
    default:
      return MessageSquare;
  }
}

export function NotificationBell() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { data: notifications = [] } = useNotifications(userId);
  const markRead = useMarkNotificationRead(userId);
  const markAll = useMarkAllNotificationsRead(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  // Fermeture au clic extérieur / touche Échap.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!userId) return null;

  const handleItemClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-primary-700"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `${unread} notifications non lues` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-surface shadow-lg"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const Icon = iconFor(n.type);
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleItemClick(n)}
                        className={cn(
                          'flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                          !n.is_read && 'bg-primary-50/40',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            n.is_read
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-primary-100 text-primary-700',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block text-sm leading-snug',
                              n.is_read ? 'text-gray-600' : 'font-medium text-gray-800',
                            )}
                          >
                            {n.message}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-400">
                            {formatRelative(n.created_at)}
                          </span>
                        </span>
                        {!n.is_read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-gray-100 px-4 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-gray-50"
          >
            Voir toutes les notifications <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

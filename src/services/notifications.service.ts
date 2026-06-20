import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';

/** Notifications de l'utilisateur courant (les plus récentes d'abord). */
export async function fetchNotifications(limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
}

/** Notifications paginées (page dédiée), avec filtre « non lues ». */
export async function fetchNotificationsPage(
  opts: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
): Promise<PaginatedNotifications> {
  const { page = 1, pageSize = 20, unreadOnly = false } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { items: (data ?? []) as Notification[], total: count ?? 0, page, pageSize };
}

/** Marque une notification comme lue. */
export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

/** Marque toutes les notifications non lues de l'utilisateur comme lues. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

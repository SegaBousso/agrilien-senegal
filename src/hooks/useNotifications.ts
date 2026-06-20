import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.service';

/**
 * Notifications de l'utilisateur connecté. Les lignes sont créées côté serveur
 * (triggers SQL sur purchase_requests) : on rafraîchit donc par polling et au
 * retour de focus pour refléter les nouveautés sans realtime.
 */
export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(),
    enabled: !!userId,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Notifications paginées pour la page dédiée. La clé partage le préfixe
 * ['notifications', userId] pour être invalidée par les mutations de lecture. */
export function useNotificationsPage(
  userId: string | undefined,
  page: number,
  unreadOnly: boolean,
) {
  return useQuery({
    queryKey: ['notifications', userId, 'page', page, unreadOnly],
    queryFn: () => fetchNotificationsPage({ page, unreadOnly }),
    enabled: !!userId,
    placeholderData: (prev) => prev,
  });
}

export function useMarkNotificationRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  });
}

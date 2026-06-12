import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
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

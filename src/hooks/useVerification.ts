import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducerProfile, requestVerification } from '@/services/profiles.service';

/** Profil producteur de l'utilisateur courant (dont son statut de vérification). */
export function useMyProducerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['producer-profile', userId],
    queryFn: () => fetchProducerProfile(userId!),
    enabled: !!userId,
  });
}

/** Le producteur demande la vérification de son compte. */
export function useRequestVerification(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => requestVerification(userId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['producer-profile', userId] }),
  });
}

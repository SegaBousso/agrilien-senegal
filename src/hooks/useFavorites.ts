import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFavorite,
  fetchFavoriteIds,
  fetchFavoriteListings,
  removeFavorite,
} from '@/services/favorites.service';
import { useAuth } from '@/context/AuthContext';

export function useFavoriteIds() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['favorites', 'ids', userId],
    queryFn: () => fetchFavoriteIds(userId!),
    enabled: !!userId,
  });
}

export function useFavoriteListings() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['favorites', 'listings', userId],
    queryFn: () => fetchFavoriteListings(userId!),
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, isFavorite }: { listingId: string; isFavorite: boolean }) =>
      isFavorite ? removeFavorite(userId!, listingId) : addFavorite(userId!, listingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

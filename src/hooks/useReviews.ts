import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyReviews,
  fetchProducerReviews,
  submitProducerReview,
} from '@/services/reviews.service';

export function useProducerReviews(producerId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'producer', producerId],
    queryFn: () => fetchProducerReviews(producerId!),
    enabled: !!producerId,
  });
}

export function useMyReviews(buyerId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'mine', buyerId],
    queryFn: () => fetchMyReviews(buyerId!),
    enabled: !!buyerId,
  });
}

export function useSubmitReview(buyerId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, rating, comment }: { transactionId: string; rating: number; comment?: string }) =>
      submitProducerReview(transactionId, rating, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['reviews', 'mine', buyerId] });
      // La moyenne dénormalisée change -> rafraîchir annonces & profil.
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['producer-profile'] });
    },
  });
}

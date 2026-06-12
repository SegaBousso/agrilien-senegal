import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchMyTransactions, initiatePayment } from '@/services/payments.service';

/** Transactions de l'acheteur connecté (pour connaître l'état de paiement). */
export function useMyTransactions(enabled: boolean) {
  return useQuery({
    queryKey: ['transactions', 'mine'],
    queryFn: fetchMyTransactions,
    enabled,
  });
}

/**
 * Initie un paiement puis redirige vers le checkout PayTech.
 * networkMode 'always' : on ne veut surtout pas relancer un paiement hors-ligne.
 */
export function useInitiatePayment() {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: (requestId: string) => initiatePayment(requestId),
    onSuccess: ({ redirect_url }) => {
      window.location.href = redirect_url;
    },
  });
}

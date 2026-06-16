import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchIntechStatus,
  initiateIntechOperation,
  type IntechInitInput,
} from '@/services/intech.service';

/** Initie une opération InTech (cash-in). Ne pas réessayer un paiement hors-ligne. */
export function useInitiateIntech() {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: (input: IntechInitInput) => initiateIntechOperation(input),
  });
}

/**
 * Suit le statut d'une opération en interrogeant NOTRE table (alimentée par le
 * callback). Polling court tant que l'opération n'est pas dans un état terminal.
 */
export function useIntechStatus(externalTransactionId: string | undefined) {
  return useQuery({
    queryKey: ['intech', 'status', externalTransactionId],
    queryFn: () => fetchIntechStatus(externalTransactionId!),
    enabled: !!externalTransactionId,
    refetchInterval: (query) => {
      const s = query.state.data;
      return s === 'SUCCESS' || s === 'FAILLED' || s === 'CANCELED' || s === 'REFUNDED'
        ? false
        : 4000;
    },
  });
}

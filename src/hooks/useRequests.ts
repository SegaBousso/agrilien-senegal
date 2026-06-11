import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPurchaseRequest,
  fetchMyRequests,
  fetchReceivedRequests,
  updateRequestStatus,
} from '@/services/requests.service';
import type { PurchaseRequestInput } from '@/lib/validations';
import type { RequestStatus } from '@/types/database';

export function useMyRequests(buyerId: string | undefined) {
  return useQuery({
    queryKey: ['requests', 'mine', buyerId],
    queryFn: () => fetchMyRequests(buyerId!),
    enabled: !!buyerId,
  });
}

export function useReceivedRequests(listingIds: string[]) {
  return useQuery({
    queryKey: ['requests', 'received', listingIds],
    queryFn: () => fetchReceivedRequests(listingIds),
    enabled: listingIds.length > 0,
  });
}

export function useCreatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      buyerId,
      input,
    }: {
      listingId: string;
      buyerId: string;
      input: PurchaseRequestInput;
    }) => createPurchaseRequest(listingId, buyerId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      updateRequestStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}

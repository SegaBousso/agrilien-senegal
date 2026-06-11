import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createListing,
  deleteListing,
  fetchListingById,
  fetchMyListings,
  fetchPublicListings,
  fetchRecentListings,
  updateListing,
  updateListingStatus,
  type ListingFilters,
} from '@/services/listings.service';
import type { ListingInput } from '@/lib/validations';
import type { ListingStatus } from '@/types/database';

export function usePublicListings(filters: ListingFilters) {
  return useQuery({
    queryKey: ['listings', 'public', filters],
    queryFn: () => fetchPublicListings(filters),
    placeholderData: (prev) => prev,
  });
}

export function useRecentListings(limit = 6) {
  return useQuery({
    queryKey: ['listings', 'recent', limit],
    queryFn: () => fetchRecentListings(limit),
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListingById(id!),
    enabled: !!id,
  });
}

export function useMyListings(producerId: string | null) {
  return useQuery({
    queryKey: ['listings', 'mine', producerId],
    queryFn: () => fetchMyListings(producerId!),
    enabled: !!producerId,
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ producerId, input }: { producerId: string; input: ListingInput }) =>
      createListing(producerId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ListingInput> }) =>
      updateListing(id, input),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings'] }),
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      updateListingStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

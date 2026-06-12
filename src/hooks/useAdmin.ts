import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminStats,
  fetchAllListings,
  fetchAllUsers,
  fetchImpactStats,
  fetchPriceTrend,
  fetchVolumeByCategory,
  updateUserRole,
} from '@/services/admin.service';
import type { ListingStatus, UserRole } from '@/types/database';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats });
}

export function useImpactStats() {
  return useQuery({ queryKey: ['admin', 'impact'], queryFn: fetchImpactStats });
}

export function usePriceTrend(months = 6) {
  return useQuery({ queryKey: ['admin', 'price-trend', months], queryFn: () => fetchPriceTrend(months) });
}

export function useVolumeByCategory() {
  return useQuery({ queryKey: ['admin', 'volume-category'], queryFn: fetchVolumeByCategory });
}

export function useAdminListings(status?: ListingStatus) {
  return useQuery({
    queryKey: ['admin', 'listings', status],
    queryFn: () => fetchAllListings(status),
  });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: fetchAllUsers });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminUserAction,
  fetchAdminStats,
  fetchAllListings,
  fetchAllUsers,
  fetchImpactStats,
  fetchPriceTrend,
  fetchUserDetail,
  fetchVerifications,
  fetchVolumeByCategory,
  setProducerVerification,
  updateUserRole,
  type AdminUserAction,
} from '@/services/admin.service';
import type { ListingStatus, UserRole, VerificationStatus } from '@/types/database';

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

export function useAdminListings(status: ListingStatus | undefined, page: number) {
  return useQuery({
    queryKey: ['admin', 'listings', status ?? 'all', page],
    queryFn: () => fetchAllListings({ status, page }),
    placeholderData: (prev) => prev,
  });
}

export function useAdminUsers(page: number, search: string) {
  return useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => fetchAllUsers({ page, search }),
    placeholderData: (prev) => prev,
  });
}

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user-detail', userId],
    queryFn: () => fetchUserDetail(userId!),
    enabled: !!userId,
  });
}

export function useVerifications(status: VerificationStatus = 'en_attente') {
  return useQuery({
    queryKey: ['admin', 'verifications', status],
    queryFn: () => fetchVerifications(status),
  });
}

export function useSetProducerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, verified, notes }: { userId: string; verified: boolean; notes?: string }) =>
      setProducerVerification(userId, verified, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'verifications'] }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useAdminUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, userId }: { action: AdminUserAction; userId: string }) =>
      adminUserAction(action, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

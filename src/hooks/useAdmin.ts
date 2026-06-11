import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminStats,
  fetchAllListings,
  fetchAllUsers,
  updateUserRole,
} from '@/services/admin.service';
import type { ListingStatus, UserRole } from '@/types/database';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchAdminStats });
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

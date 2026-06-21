import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminSetProviderMembership,
  adminSetProviderVerification,
  createMyProvider,
  fetchMyProvider,
  fetchProvider,
  fetchProvidersByStatus,
  fetchPublicProviders,
  requestProviderVerification,
  updateMyProvider,
  type ProviderFilters,
} from '@/services/providers.service';
import type { ServiceProviderInput } from '@/lib/validations';
import type { VerificationStatus } from '@/types/database';

/** Carnet public (filtré par domaine / région). */
export function usePublicProviders(filters: ProviderFilters) {
  return useQuery({
    queryKey: ['providers', 'public', filters.domain ?? 'all', filters.region ?? 'all'],
    queryFn: () => fetchPublicProviders(filters),
  });
}

export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: ['providers', 'one', id],
    queryFn: () => fetchProvider(id!),
    enabled: !!id,
  });
}

/** L'entrée du prestataire connecté. */
export function useMyProvider(userId: string | undefined) {
  return useQuery({
    queryKey: ['providers', 'mine', userId],
    queryFn: () => fetchMyProvider(userId!),
    enabled: !!userId,
  });
}

export function useCreateProvider(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceProviderInput) => createMyProvider(input, userId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers', 'mine', userId] });
      qc.invalidateQueries({ queryKey: ['providers', 'public'] });
    },
  });
}

export function useUpdateProvider(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ServiceProviderInput }) =>
      updateMyProvider(id, input, userId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers', 'mine', userId] });
      qc.invalidateQueries({ queryKey: ['providers', 'public'] });
    },
  });
}

export function useRequestProviderVerification(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestProviderVerification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers', 'mine', userId] }),
  });
}

// --- Admin -------------------------------------------------------------------

export function useAdminProviders(status: VerificationStatus) {
  return useQuery({
    queryKey: ['admin', 'providers', status],
    queryFn: () => fetchProvidersByStatus(status),
  });
}

export function useSetProviderVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verified, notes }: { id: string; verified: boolean; notes?: string }) =>
      adminSetProviderVerification(id, verified, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      qc.invalidateQueries({ queryKey: ['providers', 'public'] });
    },
  });
}

export function useSetProviderMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active, until }: { id: string; active: boolean; until?: string }) =>
      adminSetProviderMembership(id, active, until),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'providers'] });
      qc.invalidateQueries({ queryKey: ['providers', 'public'] });
    },
  });
}

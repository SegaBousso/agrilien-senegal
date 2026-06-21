import { supabase } from '@/lib/supabase';
import type { ServiceCategory, ServiceProvider, VerificationStatus } from '@/types/database';
import type { ServiceProviderInput } from '@/lib/validations';

export interface ProviderFilters {
  category?: ServiceCategory;
  region?: string;
}

/** Entrées publiques du Carnet (vérifiées + publiées). Les « Partenaires » en tête. */
export async function fetchPublicProviders(filters: ProviderFilters = {}): Promise<ServiceProvider[]> {
  let query = supabase
    .from('service_providers')
    .select('*')
    .eq('is_published', true)
    .eq('verification_status', 'verifie')
    .order('membership_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.region) query = query.eq('region', filters.region);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ServiceProvider[];
}

/** Une fiche prestataire (RLS : publique si vérifiée, sinon propriétaire/admin). */
export async function fetchProvider(id: string): Promise<ServiceProvider | null> {
  const { data, error } = await supabase.from('service_providers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as ServiceProvider) ?? null;
}

/** L'entrée du prestataire connecté (null s'il n'en a pas encore créé). */
export async function fetchMyProvider(userId: string): Promise<ServiceProvider | null> {
  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ServiceProvider) ?? null;
}

/** Normalise le formulaire en ligne de table (vide → null). */
function toRow(input: ServiceProviderInput, userId: string) {
  return {
    user_id: userId,
    name: input.name.trim(),
    category: input.category,
    region: input.region,
    commune: input.commune?.trim() || null,
    service_areas: input.service_areas ?? [],
    phone: input.phone.trim(),
    whatsapp: input.whatsapp?.trim() || null,
    description: input.description?.trim() || null,
  };
}

export async function createMyProvider(input: ServiceProviderInput, userId: string): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from('service_providers')
    .insert(toRow(input, userId))
    .select('*')
    .single();
  if (error) throw error;
  return data as ServiceProvider;
}

export async function updateMyProvider(id: string, input: ServiceProviderInput, userId: string) {
  const { error } = await supabase.from('service_providers').update(toRow(input, userId)).eq('id', id);
  if (error) throw error;
}

/** Le prestataire demande la vérification (→ 'en_attente' ; gardé par trigger). */
export async function requestProviderVerification(id: string) {
  const { error } = await supabase
    .from('service_providers')
    .update({ verification_status: 'en_attente' })
    .eq('id', id);
  if (error) throw error;
}

// --- Admin -------------------------------------------------------------------

/** File d'attente / annuaire admin par statut de vérification. */
export async function fetchProvidersByStatus(status: VerificationStatus): Promise<ServiceProvider[]> {
  const { data, error } = await supabase
    .from('service_providers')
    .select('*')
    .eq('verification_status', status)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceProvider[];
}

export async function adminSetProviderVerification(id: string, verified: boolean, notes?: string) {
  const { error } = await supabase.rpc('admin_set_provider_verification', {
    p_id: id,
    p_verified: verified,
    p_notes: notes ?? null,
  });
  if (error) throw error;
}

export async function adminSetProviderMembership(id: string, active: boolean, until?: string) {
  const { error } = await supabase.rpc('admin_set_provider_membership', {
    p_id: id,
    p_active: active,
    p_until: until ?? null,
  });
  if (error) throw error;
}

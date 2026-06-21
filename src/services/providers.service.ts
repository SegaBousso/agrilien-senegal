import { supabase } from '@/lib/supabase';
import type { Service, ServiceDomain, ServiceProvider, VerificationStatus } from '@/types/database';
import type { ServiceProviderInput } from '@/lib/validations';

export interface ProviderFilters {
  domain?: ServiceDomain;
  region?: string;
}

const SELECT_WITH_SERVICES = '*, provider_services(service:services(*))';

type ProviderRow = ServiceProvider & { provider_services?: { service: Service | null }[] };

/** Aplati la jointure provider_services → services[]. */
function flatten(row: ProviderRow): ServiceProvider {
  const { provider_services, ...rest } = row;
  const services = (provider_services ?? [])
    .map((ps) => ps.service)
    .filter((s): s is Service => Boolean(s))
    .sort((a, b) => a.sort_order - b.sort_order);
  return { ...(rest as ServiceProvider), services };
}

/** Entrées publiques du Carnet (vérifiées + publiées). Les « Partenaires » en tête. */
export async function fetchPublicProviders(filters: ProviderFilters = {}): Promise<ServiceProvider[]> {
  let query = supabase
    .from('service_providers')
    .select(SELECT_WITH_SERVICES)
    .eq('is_published', true)
    .eq('verification_status', 'verifie')
    .order('membership_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.region) query = query.eq('region', filters.region);

  const { data, error } = await query;
  if (error) throw error;

  let providers = ((data ?? []) as ProviderRow[]).map(flatten);
  if (filters.domain) {
    providers = providers.filter((p) => (p.services ?? []).some((s) => s.domain === filters.domain));
  }
  return providers;
}

/** Une fiche prestataire (RLS : publique si vérifiée, sinon propriétaire/admin). */
export async function fetchProvider(id: string): Promise<ServiceProvider | null> {
  const { data, error } = await supabase
    .from('service_providers')
    .select(SELECT_WITH_SERVICES)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? flatten(data as ProviderRow) : null;
}

/** L'entrée du prestataire connecté (null s'il n'en a pas encore créé). */
export async function fetchMyProvider(userId: string): Promise<ServiceProvider | null> {
  const { data, error } = await supabase
    .from('service_providers')
    .select(SELECT_WITH_SERVICES)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? flatten(data as ProviderRow) : null;
}

/** Normalise le formulaire en ligne de table (hors service_ids, géré à part). */
function toRow(input: ServiceProviderInput, userId: string) {
  return {
    user_id: userId,
    name: input.name.trim(),
    region: input.region,
    commune: input.commune?.trim() || null,
    service_areas: input.service_areas ?? [],
    phone: input.phone.trim(),
    whatsapp: input.whatsapp?.trim() || null,
    description: input.description?.trim() || null,
  };
}

/** Remplace l'ensemble des services proposés par un prestataire. */
async function setProviderServices(providerId: string, serviceIds: string[]) {
  const del = await supabase.from('provider_services').delete().eq('provider_id', providerId);
  if (del.error) throw del.error;
  if (serviceIds.length === 0) return;
  const ins = await supabase
    .from('provider_services')
    .insert(serviceIds.map((service_id) => ({ provider_id: providerId, service_id })));
  if (ins.error) throw ins.error;
}

export async function createMyProvider(input: ServiceProviderInput, userId: string): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from('service_providers')
    .insert(toRow(input, userId))
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  await setProviderServices(id, input.service_ids ?? []);
  return (await fetchProvider(id))!;
}

export async function updateMyProvider(id: string, input: ServiceProviderInput, userId: string) {
  const { error } = await supabase.from('service_providers').update(toRow(input, userId)).eq('id', id);
  if (error) throw error;
  await setProviderServices(id, input.service_ids ?? []);
}

/** Crée la fiche prestataire de base à l'inscription (best-effort, un par user). */
export async function upsertProviderAtSignup(
  userId: string,
  fields: { name: string; region: string; phone: string },
) {
  const { error } = await supabase
    .from('service_providers')
    .upsert({ user_id: userId, ...fields }, { onConflict: 'user_id' });
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
    .select(SELECT_WITH_SERVICES)
    .eq('verification_status', status)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ProviderRow[]).map(flatten);
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

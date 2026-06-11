import { supabase } from '@/lib/supabase';
import type { BuyerProfile, ProducerProfile, Profile } from '@/types/database';

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchProducerProfile(userId: string) {
  const { data, error } = await supabase
    .from('producer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProducerProfile | null;
}

export async function fetchBuyerProfile(userId: string) {
  const { data, error } = await supabase
    .from('buyer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as BuyerProfile | null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function upsertProducerProfile(
  userId: string,
  patch: Partial<Omit<ProducerProfile, 'id' | 'user_id' | 'created_at'>>,
) {
  const { data, error } = await supabase
    .from('producer_profiles')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as ProducerProfile;
}

export async function upsertBuyerProfile(
  userId: string,
  patch: Partial<Omit<BuyerProfile, 'id' | 'user_id' | 'created_at'>>,
) {
  const { data, error } = await supabase
    .from('buyer_profiles')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as BuyerProfile;
}

/**
 * Garantit l'existence d'un profil producteur et renvoie son id.
 * Auto-réparation des comptes dont le profil n'a pas été créé à l'inscription
 * (ex. inscription avec confirmation d'email activée).
 */
export async function ensureProducerProfile(
  userId: string,
  defaults: { farm_name: string; region: string },
) {
  const existing = await fetchProducerProfile(userId);
  if (existing) return existing;
  return upsertProducerProfile(userId, defaults);
}

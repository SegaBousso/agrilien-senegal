import { supabase } from '@/lib/supabase';
import type { OfficialPrice } from '@/types/database';
import type { OfficialPriceInput } from '@/lib/validations';

/** Références « actives » (l'interrupteur ; la fenêtre de dates est filtrée côté UI). */
export async function fetchActiveOfficialPrices(): Promise<OfficialPrice[]> {
  const { data, error } = await supabase
    .from('official_prices')
    .select('*')
    .eq('active', true);
  if (error) throw error;
  return (data ?? []) as OfficialPrice[];
}

/** Toutes les références (écran admin). */
export async function fetchAllOfficialPrices(): Promise<OfficialPrice[]> {
  const { data, error } = await supabase
    .from('official_prices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OfficialPrice[];
}

/** Normalise les champs vides en null avant écriture. */
function toRow(input: OfficialPriceInput) {
  return {
    label: input.label.trim(),
    keyword: input.keyword.trim().toLowerCase(),
    campaign: input.campaign?.trim() || null,
    price: input.price,
    unit: input.unit,
    source: input.source?.trim() || null,
    starts_on: input.starts_on || null,
    ends_on: input.ends_on || null,
    active: input.active,
  };
}

export async function createOfficialPrice(input: OfficialPriceInput) {
  const { error } = await supabase.from('official_prices').insert(toRow(input));
  if (error) throw error;
}

export async function updateOfficialPrice(id: string, input: OfficialPriceInput) {
  const { error } = await supabase.from('official_prices').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteOfficialPrice(id: string) {
  const { error } = await supabase.from('official_prices').delete().eq('id', id);
  if (error) throw error;
}

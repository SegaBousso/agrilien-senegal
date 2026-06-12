import { supabase } from '@/lib/supabase';
import type { Listing, ListingStatus, Profile, UserRole } from '@/types/database';

export interface AdminStats {
  totalUsers: number;
  totalProducers: number;
  totalBuyers: number;
  totalListings: number;
  pendingListings: number;
  publishedListings: number;
  totalRequests: number;
  listingsByRegion: { region: string; count: number }[];
}

/** Indicateurs clés du tableau de bord admin. */
export async function fetchAdminStats(): Promise<AdminStats> {
  const countAll = (table: string) =>
    supabase.from(table).select('*', { count: 'exact', head: true });

  const [users, producers, buyers, listings, pending, published, requests, regionRows] =
    await Promise.all([
      countAll('profiles'),
      countAll('profiles').eq('role', 'producer'),
      countAll('profiles').eq('role', 'buyer'),
      countAll('listings'),
      countAll('listings').eq('status', 'en_attente'),
      countAll('listings').eq('status', 'publiee'),
      countAll('purchase_requests'),
      supabase.from('listings').select('region'),
    ]);

  const byRegion = new Map<string, number>();
  for (const row of (regionRows.data ?? []) as { region: string }[]) {
    byRegion.set(row.region, (byRegion.get(row.region) ?? 0) + 1);
  }

  return {
    totalUsers: users.count ?? 0,
    totalProducers: producers.count ?? 0,
    totalBuyers: buyers.count ?? 0,
    totalListings: listings.count ?? 0,
    pendingListings: pending.count ?? 0,
    publishedListings: published.count ?? 0,
    totalRequests: requests.count ?? 0,
    listingsByRegion: [...byRegion.entries()]
      .map(([region, c]) => ({ region, count: c }))
      .sort((a, b) => b.count - a.count),
  };
}

export interface ImpactStats {
  pertes_evitees_kg: number;
  volume_demande_kg: number;
  transactions_payees: number;
  montant_paye: number;
  taux_acceptation: number;
  producteurs_actifs: number;
}

/** Indicateurs d'impact agrégés en base (RPC SECURITY DEFINER, admin only). */
export async function fetchImpactStats(): Promise<ImpactStats> {
  const { data, error } = await supabase.rpc('admin_impact_stats');
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    pertes_evitees_kg: Number(d.pertes_evitees_kg ?? 0),
    volume_demande_kg: Number(d.volume_demande_kg ?? 0),
    transactions_payees: Number(d.transactions_payees ?? 0),
    montant_paye: Number(d.montant_paye ?? 0),
    taux_acceptation: Number(d.taux_acceptation ?? 0),
    producteurs_actifs: Number(d.producteurs_actifs ?? 0),
  };
}

/** Prix moyen des annonces par mois (N derniers mois). */
export async function fetchPriceTrend(months = 6): Promise<{ label: string; value: number }[]> {
  const { data, error } = await supabase.rpc('admin_price_trend', { p_months: months });
  if (error) throw error;
  return ((data ?? []) as { label: string; avg_price: number }[]).map((r) => ({
    label: r.label,
    value: Number(r.avg_price),
  }));
}

/** Volume échangé (pertes évitées) par catégorie. */
export async function fetchVolumeByCategory(): Promise<{ label: string; value: number }[]> {
  const { data, error } = await supabase.rpc('admin_volume_by_category');
  if (error) throw error;
  return ((data ?? []) as { category: string; volume: number }[]).map((r) => ({
    label: r.category,
    value: Number(r.volume),
  }));
}

/** Annonces pour la modération (tous statuts). */
export async function fetchAllListings(status?: ListingStatus) {
  let query = supabase
    .from('listings')
    .select(
      `*, producer:producer_profiles(farm_name, profile:profiles(full_name)), images:listing_images(*)`,
    )
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as (Listing & {
    producer: { farm_name: string; profile: { full_name: string } };
    images: { image_url: string; is_main: boolean }[];
  })[];
}

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

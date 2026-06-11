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

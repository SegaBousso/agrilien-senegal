import { supabase } from '@/lib/supabase';
import type { BuyerType, Listing, ListingStatus, Profile, UserRole } from '@/types/database';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type AdminListing = Listing & {
  producer: { farm_name: string; profile: { full_name: string } };
  images: { image_url: string; is_main: boolean }[];
};

/** Neutralise les métacaractères PostgREST pour éviter l'injection de filtre. */
function sanitize(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s@._-]/gu, ' ').trim();
}

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
      supabase.rpc('admin_listings_by_region'),
    ]);

  const listingsByRegion = ((regionRows.data ?? []) as { region: string; count: number }[]).map(
    (r) => ({ region: r.region, count: Number(r.count) }),
  );

  return {
    totalUsers: users.count ?? 0,
    totalProducers: producers.count ?? 0,
    totalBuyers: buyers.count ?? 0,
    totalListings: listings.count ?? 0,
    pendingListings: pending.count ?? 0,
    publishedListings: published.count ?? 0,
    totalRequests: requests.count ?? 0,
    listingsByRegion,
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

/** Annonces pour la modération (paginées, filtre statut optionnel). */
export async function fetchAllListings(
  opts: { status?: ListingStatus; page?: number; pageSize?: number } = {},
): Promise<Paginated<AdminListing>> {
  const { status, page = 1, pageSize = 15 } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('listings')
    .select(
      `*, producer:producer_profiles(farm_name, profile:profiles(full_name)), images:listing_images(*)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return {
    items: (data ?? []) as unknown as AdminListing[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Utilisateurs (paginés, recherche nom/email optionnelle). */
export async function fetchAllUsers(
  opts: { page?: number; pageSize?: number; search?: string } = {},
): Promise<Paginated<Profile>> {
  const { page = 1, pageSize = 20, search } = opts;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    const term = sanitize(search);
    if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { items: (data ?? []) as Profile[], total: count ?? 0, page, pageSize };
}

export interface AdminUserDetail {
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    suspended: boolean;
    created_at: string;
  };
  producer: { farm_name: string; region: string; commune: string | null } | null;
  buyer: { buyer_type: BuyerType; organization_name: string | null; region: string | null } | null;
  activity: {
    listings_count: number;
    requests_received: number;
    requests_sent: number;
    favorites_count: number;
    deposits_paid_count: number;
    deposits_paid_amount: number;
  };
  recent_actions: {
    action: string;
    created_at: string;
    details: Record<string, unknown> | null;
    admin_name: string | null;
  }[];
}

/** Fiche complète d'un utilisateur (RPC SECURITY DEFINER, admin only). */
export async function fetchUserDetail(userId: string): Promise<AdminUserDetail> {
  const { data, error } = await supabase.rpc('admin_user_detail', { p_user_id: userId });
  if (error) throw error;
  return data as AdminUserDetail;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export type AdminUserAction = 'suspend' | 'reactivate' | 'reset_password';

/** Action sensible sur un compte (Edge Function admin-users, journalisée). */
export async function adminUserAction(action: AdminUserAction, userId: string) {
  const { error } = await supabase.functions.invoke('admin-users', { body: { action, userId } });
  if (error) {
    // Remonte le message précis renvoyé par la fonction (corps masqué par supabase-js).
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      const body = await ctx.clone().json().catch(() => null);
      if (body?.error) throw new Error(String(body.error));
    }
    throw error;
  }
}

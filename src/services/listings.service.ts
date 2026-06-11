import { supabase } from '@/lib/supabase';
import type { ListingInput } from '@/lib/validations';
import type { Listing, ListingStatus, ListingWithRelations } from '@/types/database';

export interface ListingFilters {
  search?: string;
  categoryId?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  sort?: 'recent' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

const LISTING_SELECT = `
  *,
  category:product_categories(*),
  producer:producer_profiles(*, profile:profiles(full_name, phone, email)),
  images:listing_images(*)
`;

/** Catalogue public : annonces publiées, filtrées et paginées. */
export async function fetchPublicListings(filters: ListingFilters = {}) {
  const { page = 1, pageSize = 12 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('listings')
    .select(LISTING_SELECT, { count: 'exact' })
    .eq('status', 'publiee');

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.region) query = query.eq('region', filters.region);
  if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
  if (filters.minQuantity != null) query = query.gte('quantity', filters.minQuantity);

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return {
    items: (data ?? []) as unknown as ListingWithRelations[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Dernières annonces publiées pour la page d'accueil. */
export async function fetchRecentListings(limit = 6) {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'publiee')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ListingWithRelations[];
}

export async function fetchListingById(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as ListingWithRelations;
}

/** Annonces du producteur connecté. */
export async function fetchMyListings(producerId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ListingWithRelations[];
}

export async function createListing(producerId: string, input: ListingInput) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      producer_id: producerId,
      category_id: input.category_id,
      title: input.title,
      description: input.description || null,
      quantity: input.quantity,
      unit: input.unit,
      price: input.price,
      region: input.region,
      locality: input.locality || null,
      availability_date: input.availability_date || null,
      delivery_option: input.delivery_option || null,
      status: 'en_attente',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function updateListing(id: string, input: Partial<ListingInput>) {
  const { data, error } = await supabase
    .from('listings')
    .update({
      ...input,
      description: input.description || null,
      locality: input.locality || null,
      availability_date: input.availability_date || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

/** Changement de statut — réservé admin (publiee/suspendue) ou producteur (vendue/expiree). */
export async function updateListingStatus(id: string, status: ListingStatus) {
  const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

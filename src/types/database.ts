/**
 * Types de la base Supabase.
 * Reflète le schéma SQL (supabase/migrations). En production, ce fichier peut
 * être régénéré avec : `supabase gen types typescript --project-id <id>`.
 */

export type UserRole = 'visitor' | 'producer' | 'buyer' | 'admin';

export type BuyerType =
  | 'particulier'
  | 'commercant'
  | 'restaurant'
  | 'entreprise'
  | 'cooperative'
  | 'institution';

export type ListingStatus =
  | 'brouillon'
  | 'en_attente'
  | 'publiee'
  | 'suspendue'
  | 'vendue'
  | 'expiree';

export type RequestStatus =
  | 'nouvelle'
  | 'en_discussion'
  | 'acceptee'
  | 'refusee'
  | 'terminee';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: number;
  name: string;
}

export interface ProducerProfile {
  id: string;
  user_id: string;
  farm_name: string;
  region: string;
  commune: string | null;
  description: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface BuyerProfile {
  id: string;
  user_id: string;
  buyer_type: BuyerType;
  organization_name: string | null;
  region: string | null;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  producer_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  price: number;
  region: string;
  locality: string | null;
  availability_date: string | null;
  delivery_option: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  is_main: boolean;
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  quantity_requested: number;
  message: string | null;
  status: RequestStatus;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Annonce enrichie avec ses relations (jointures fréquentes). */
export interface ListingWithRelations extends Listing {
  category: ProductCategory | null;
  producer: ProducerProfile & { profile: Pick<Profile, 'full_name'> };
  images: ListingImage[];
}

export interface PurchaseRequestWithRelations extends PurchaseRequest {
  listing: Pick<Listing, 'id' | 'title' | 'unit' | 'price' | 'region'> & {
    images: ListingImage[];
  };
  buyer: Pick<Profile, 'id' | 'full_name' | 'phone' | 'email'>;
}

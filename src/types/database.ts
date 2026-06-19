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
  suspended: boolean;
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
  is_livestock: boolean;
  created_at: string;
}

/** Caractéristiques propres au bétail (stockées dans listings.attributes). */
export interface AnimalAttributes {
  race?: string;
  age?: string;
  sexe?: 'male' | 'femelle';
  poids?: number;
  vaccine?: boolean;
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
  attributes: AnimalAttributes | null;
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
  buyer_name: string | null;
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

export type PaymentStatus =
  | 'initie'
  | 'en_attente'
  | 'paye'
  | 'echoue'
  | 'annule'
  | 'a_rembourser'
  | 'rembourse';

export interface Transaction {
  id: string;
  ref_command: string;
  request_id: string | null;
  buyer_id: string;
  amount: number;
  currency: string;
  provider: string;
  payment_method: string | null;
  token: string | null;
  client_phone: string | null;
  status: PaymentStatus;
  env: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
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
  // null tant que l'acompte n'est pas payé (le profil acheteur est gaté par RLS).
  // Le nom reste disponible via `buyer_name`.
  buyer: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
}

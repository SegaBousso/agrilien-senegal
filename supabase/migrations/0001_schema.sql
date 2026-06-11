-- =============================================================================
-- AgriLien Sénégal — Schéma de base de données (PostgreSQL / Supabase)
-- Migration 0001 : enums, tables, index, triggers
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
create type user_role as enum ('visitor', 'producer', 'buyer', 'admin');

create type buyer_type as enum (
  'particulier', 'commercant', 'restaurant', 'entreprise', 'cooperative', 'institution'
);

create type listing_status as enum (
  'brouillon', 'en_attente', 'publiee', 'suspendue', 'vendue', 'expiree'
);

create type request_status as enum (
  'nouvelle', 'en_discussion', 'acceptee', 'refusee', 'terminee'
);

-- -----------------------------------------------------------------------------
-- PROFILS (extension de auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  phone       text,
  role        user_role not null default 'buyer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- RÉGIONS (14 régions du Sénégal)
-- -----------------------------------------------------------------------------
create table public.regions (
  id    serial primary key,
  name  text not null unique
);

-- -----------------------------------------------------------------------------
-- PROFILS PRODUCTEUR
-- -----------------------------------------------------------------------------
create table public.producer_profiles (
  id             uuid primary key default gen_random_uuid (),
  user_id        uuid not null unique references public.profiles (id) on delete cascade,
  farm_name      text not null,
  region         text not null,
  commune        text,
  description    text,
  profile_image  text,
  created_at     timestamptz not null default now()
);

create index producer_profiles_user_idx on public.producer_profiles (user_id);
create index producer_profiles_region_idx on public.producer_profiles (region);

-- -----------------------------------------------------------------------------
-- PROFILS ACHETEUR
-- -----------------------------------------------------------------------------
create table public.buyer_profiles (
  id                 uuid primary key default gen_random_uuid (),
  user_id            uuid not null unique references public.profiles (id) on delete cascade,
  buyer_type         buyer_type not null default 'particulier',
  organization_name  text,
  region             text,
  created_at         timestamptz not null default now()
);

create index buyer_profiles_user_idx on public.buyer_profiles (user_id);

-- -----------------------------------------------------------------------------
-- CATÉGORIES DE PRODUITS
-- -----------------------------------------------------------------------------
create table public.product_categories (
  id           uuid primary key default gen_random_uuid (),
  name         text not null unique,
  description  text,
  icon         text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ANNONCES
-- -----------------------------------------------------------------------------
create table public.listings (
  id                 uuid primary key default gen_random_uuid (),
  producer_id        uuid not null references public.producer_profiles (id) on delete cascade,
  category_id        uuid references public.product_categories (id) on delete set null,
  title              text not null,
  description        text,
  quantity           numeric(12, 2) not null check (quantity > 0),
  unit               text not null default 'kg',
  price              numeric(12, 2) not null check (price >= 0),
  region             text not null,
  locality           text,
  availability_date  date,
  delivery_option    text,
  status             listing_status not null default 'en_attente',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index listings_producer_idx on public.listings (producer_id);
create index listings_category_idx on public.listings (category_id);
create index listings_status_idx on public.listings (status);
create index listings_region_idx on public.listings (region);
create index listings_created_idx on public.listings (created_at desc);
-- Recherche plein-texte simple sur titre + description.
create index listings_search_idx on public.listings
  using gin (to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, '')));

-- -----------------------------------------------------------------------------
-- IMAGES D'ANNONCE
-- -----------------------------------------------------------------------------
create table public.listing_images (
  id          uuid primary key default gen_random_uuid (),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  image_url   text not null,
  is_main     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index listing_images_listing_idx on public.listing_images (listing_id);

-- -----------------------------------------------------------------------------
-- DEMANDES D'ACHAT
-- -----------------------------------------------------------------------------
create table public.purchase_requests (
  id                  uuid primary key default gen_random_uuid (),
  listing_id          uuid not null references public.listings (id) on delete cascade,
  buyer_id            uuid not null references public.profiles (id) on delete cascade,
  quantity_requested  numeric(12, 2) not null check (quantity_requested > 0),
  message             text,
  status              request_status not null default 'nouvelle',
  created_at          timestamptz not null default now()
);

create index purchase_requests_listing_idx on public.purchase_requests (listing_id);
create index purchase_requests_buyer_idx on public.purchase_requests (buyer_id);

-- -----------------------------------------------------------------------------
-- FAVORIS
-- -----------------------------------------------------------------------------
create table public.favorites (
  id          uuid primary key default gen_random_uuid (),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index favorites_user_idx on public.favorites (user_id);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid (),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read);

-- -----------------------------------------------------------------------------
-- TRIGGERS : updated_at automatique
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at ();

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- TRIGGER : créer un profil à l'inscription (auth.users -> profiles)
-- Le rôle et le nom sont lus depuis raw_user_meta_data.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Utilisateur'),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'buyer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

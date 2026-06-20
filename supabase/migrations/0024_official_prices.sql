-- =============================================================================
-- AgriLien Sénégal — Prix de référence officiels (filières régulées)
-- Migration 0024 : au Sénégal, l'État fixe chaque campagne un prix au producteur
-- pour certaines filières (ex. l'ARACHIDE). On stocke ces prix de référence,
-- saisis par l'admin, pour : afficher un badge « prix officiel » sur les annonces
-- concernées et AVERTIR (sans bloquer) un producteur qui publie sous le plancher.
--
-- Générique : un prix s'applique à un produit identifié par un MOT-CLÉ recherché
-- dans le titre de l'annonce (ex. « arachide »), sur une période de campagne.
-- Le mécanisme reste DORMANT tant qu'aucun prix actif n'est saisi.
--
-- Idempotent.
-- =============================================================================

create table if not exists public.official_prices (
  id          uuid primary key default gen_random_uuid (),
  label       text not null,                     -- nom affiché, ex. « Arachide »
  keyword     text not null,                     -- mot-clé recherché dans le titre (ex. « arachide »)
  campaign    text,                              -- libellé de campagne, ex. « 2025/2026 »
  price       numeric(12, 2) not null check (price >= 0),
  unit        text not null default 'kg',
  source      text,                              -- ex. « CNIA / Ministère de l'Agriculture »
  starts_on   date,                              -- début de validité (null = sans borne)
  ends_on     date,                              -- fin de validité (null = sans borne)
  active      boolean not null default true,     -- interrupteur manuel
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists official_prices_active_idx on public.official_prices (active);

drop trigger if exists official_prices_updated_at on public.official_prices;
create trigger official_prices_updated_at
  before update on public.official_prices
  for each row execute function public.set_updated_at ();

-- RLS : lisible par tous (info publique) ; écriture réservée aux admins.
alter table public.official_prices enable row level security;

drop policy if exists "Prix officiels lisibles par tous" on public.official_prices;
create policy "Prix officiels lisibles par tous"
  on public.official_prices for select using (true);

drop policy if exists "Admin gere les prix officiels" on public.official_prices;
create policy "Admin gere les prix officiels"
  on public.official_prices for all
  using (public.is_admin ())
  with check (public.is_admin ());

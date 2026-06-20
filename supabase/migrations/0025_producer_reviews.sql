-- =============================================================================
-- AgriLien Sénégal — Notation des producteurs (Phase 2 du système de confiance)
-- Migration 0025 : avis 1–5 étoiles laissés par les acheteurs.
--
-- Anti-faux-avis (« achat vérifié ») : seul un acheteur ayant PAYÉ un acompte
-- (transactions.status='paye') peut noter, UNE fois par transaction. Le
-- producteur est déduit côté serveur (impossible à falsifier). La moyenne et le
-- nombre d'avis sont dénormalisés sur producer_profiles pour un affichage léger
-- sur les annonces.
--
-- Idempotent.
-- =============================================================================

create table if not exists public.producer_reviews (
  id              uuid primary key default gen_random_uuid (),
  producer_id     uuid not null references public.producer_profiles (id) on delete cascade,
  buyer_id        uuid not null references public.profiles (id) on delete cascade,
  transaction_id  uuid not null references public.transactions (id) on delete cascade,
  buyer_name      text,                          -- dénormalisé (avis public sans fuite RLS)
  rating          int  not null check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now(),
  unique (transaction_id)                        -- un avis par achat
);

create index if not exists producer_reviews_producer_idx on public.producer_reviews (producer_id, created_at desc);
create index if not exists producer_reviews_buyer_idx on public.producer_reviews (buyer_id);

-- Note moyenne + nombre d'avis, dénormalisés sur le profil producteur.
alter table public.producer_profiles
  add column if not exists rating_avg   numeric(3, 2) not null default 0,
  add column if not exists rating_count int           not null default 0;

-- RLS : lecture publique (les avis sont publics) ; écriture uniquement via la
-- RPC submit_producer_review (SECURITY DEFINER) -> aucune policy d'écriture.
alter table public.producer_reviews enable row level security;

drop policy if exists "Avis producteurs lisibles par tous" on public.producer_reviews;
create policy "Avis producteurs lisibles par tous"
  on public.producer_reviews for select using (true);

-- -----------------------------------------------------------------------------
-- Recalcule la moyenne/le total du producteur concerné à chaque changement.
-- -----------------------------------------------------------------------------
create or replace function public.refresh_producer_rating ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pid uuid := coalesce(new.producer_id, old.producer_id);
begin
  update public.producer_profiles p
     set rating_count = (select count(*) from public.producer_reviews r where r.producer_id = v_pid),
         rating_avg   = coalesce((select round(avg(r.rating)::numeric, 2) from public.producer_reviews r where r.producer_id = v_pid), 0)
   where p.id = v_pid;
  return null;
end;
$$;

drop trigger if exists producer_reviews_refresh on public.producer_reviews;
create trigger producer_reviews_refresh
  after insert or update or delete on public.producer_reviews
  for each row execute function public.refresh_producer_rating ();

-- -----------------------------------------------------------------------------
-- Dépose (ou met à jour) un avis. Vérifie « achat vérifié » côté serveur.
-- -----------------------------------------------------------------------------
create or replace function public.submit_producer_review (
  p_transaction_id uuid,
  p_rating         int,
  p_comment        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx          record;
  v_producer_id uuid;
  v_buyer_name  text;
begin
  if p_rating < 1 or p_rating > 5 then
    raise exception 'La note doit être comprise entre 1 et 5.' using errcode = '22023';
  end if;

  select t.id, t.buyer_id, t.status, t.request_id
    into v_tx
    from public.transactions t
   where t.id = p_transaction_id;

  if v_tx.id is null then
    raise exception 'Transaction introuvable.' using errcode = '42704';
  end if;
  if v_tx.buyer_id <> auth.uid () then
    raise exception 'Vous ne pouvez noter que vos propres achats.' using errcode = '42501';
  end if;
  if v_tx.status <> 'paye' then
    raise exception 'Vous pourrez noter une fois l''acompte payé.' using errcode = '42501';
  end if;

  select l.producer_id
    into v_producer_id
    from public.purchase_requests r
    join public.listings l on l.id = r.listing_id
   where r.id = v_tx.request_id;

  if v_producer_id is null then
    raise exception 'Producteur introuvable pour cette transaction.' using errcode = '42704';
  end if;

  select full_name into v_buyer_name from public.profiles where id = auth.uid ();

  insert into public.producer_reviews (producer_id, buyer_id, transaction_id, buyer_name, rating, comment)
  values (v_producer_id, auth.uid (), p_transaction_id, v_buyer_name, p_rating, nullif(btrim(p_comment), ''))
  on conflict (transaction_id) do update
    set rating = excluded.rating, comment = excluded.comment, created_at = now();
end;
$$;

revoke all on function public.submit_producer_review (uuid, int, text) from public, anon;
grant execute on function public.submit_producer_review (uuid, int, text) to authenticated;

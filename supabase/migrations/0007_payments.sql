-- =============================================================================
-- AgriLien Sénégal — Paiements mobiles (PayTech : Orange Money, Wave, …)
-- Migration 0007 : enum payment_status, table transactions, RLS, notifications.
--
-- Toutes les écritures (création/MAJ de transaction) passent par les Edge
-- Functions `payment-initiate` et `payment-ipn` via le service_role : aucune
-- policy INSERT/UPDATE n'est ouverte aux clients. Le client ne peut donc jamais
-- fixer un montant ni forcer un statut « payé ».
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum (
      'initie',     -- transaction créée, redirection PayTech en cours
      'en_attente', -- en cours côté opérateur
      'paye',       -- paiement confirmé par l'IPN
      'echoue',     -- échec / refus
      'annule',     -- annulé par l'acheteur
      'rembourse'   -- remboursé
    );
  end if;
end $$;

create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid (),
  ref_command     text not null unique,                -- référence envoyée à PayTech
  request_id      uuid references public.purchase_requests (id) on delete set null,
  buyer_id        uuid not null references public.profiles (id) on delete cascade,
  amount          numeric(12, 2) not null check (amount >= 0),
  currency        text not null default 'XOF',
  provider        text not null default 'paytech',
  payment_method  text,                                -- rempli par l'IPN (Orange Money, Wave…)
  token           text,                                -- token PayTech
  client_phone    text,                                -- rempli par l'IPN
  status          payment_status not null default 'initie',
  env             text not null default 'test',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  paid_at         timestamptz
);

create index if not exists transactions_buyer_idx on public.transactions (buyer_id);
create index if not exists transactions_request_idx on public.transactions (request_id);
create index if not exists transactions_status_idx on public.transactions (status);

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at ();

-- -----------------------------------------------------------------------------
-- RLS : lecture seule côté client. Aucune écriture (réservée au service_role).
-- -----------------------------------------------------------------------------
alter table public.transactions enable row level security;

-- L'acheteur voit ses propres transactions.
drop policy if exists "Acheteur voit ses transactions" on public.transactions;
create policy "Acheteur voit ses transactions"
  on public.transactions for select using (buyer_id = auth.uid ());

-- Le producteur voit les transactions liées à ses annonces (suivi des paiements).
drop policy if exists "Producteur voit les transactions de ses annonces" on public.transactions;
create policy "Producteur voit les transactions de ses annonces"
  on public.transactions for select using (
    exists (
      select 1
      from public.purchase_requests r
      join public.listings l on l.id = r.listing_id
      where r.id = transactions.request_id
        and l.producer_id = public.current_producer_id ()
    )
  );

-- L'admin voit tout.
drop policy if exists "Admin voit toutes les transactions" on public.transactions;
create policy "Admin voit toutes les transactions"
  on public.transactions for select using (public.is_admin ());

-- -----------------------------------------------------------------------------
-- Notifications + SMS au moment où un paiement est confirmé (status -> paye).
-- Réutilise enqueue_sms() de la migration 0006.
-- -----------------------------------------------------------------------------
create or replace function public.notify_on_payment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_title text;
  v_producer_user uuid;
  v_producer_phone text;
  v_buyer_phone text;
begin
  if new.status is not distinct from old.status or new.status <> 'paye' then
    return new;
  end if;

  select l.title, pp.user_id
    into v_listing_title, v_producer_user
    from public.purchase_requests r
    join public.listings l on l.id = r.listing_id
    join public.producer_profiles pp on pp.id = l.producer_id
   where r.id = new.request_id;

  -- Acheteur : confirmation de paiement.
  insert into public.notifications (user_id, type, message)
  values (
    new.buyer_id,
    'payment_confirmed',
    'Votre paiement de ' || new.amount || ' FCFA a été confirmé.'
  );
  select phone into v_buyer_phone from public.profiles where id = new.buyer_id;
  perform public.enqueue_sms (
    v_buyer_phone,
    'AgriLien: paiement de ' || new.amount || ' FCFA confirme. Merci.',
    new.buyer_id,
    new.request_id
  );

  -- Producteur : paiement reçu.
  if v_producer_user is not null then
    insert into public.notifications (user_id, type, message)
    values (
      v_producer_user,
      'payment_received',
      'Paiement reçu (' || new.amount || ' FCFA) pour « '
        || coalesce(v_listing_title, 'votre annonce') || ' ».'
    );
    select phone into v_producer_phone from public.profiles where id = v_producer_user;
    perform public.enqueue_sms (
      v_producer_phone,
      'AgriLien: paiement de ' || new.amount || ' FCFA recu pour "'
        || coalesce(v_listing_title, 'votre annonce') || '". Preparez la commande.',
      v_producer_user,
      new.request_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_notify_payment on public.transactions;
create trigger transactions_notify_payment
  after update on public.transactions
  for each row execute function public.notify_on_payment ();

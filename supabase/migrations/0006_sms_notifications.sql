-- =============================================================================
-- AgriLien Sénégal — Notifications SMS (Sendtext SN)
-- Migration 0006 : file d'attente "outbox" + déclencheurs métier.
--
-- Principe : aucun appel réseau dans la transaction SQL. Les triggers se
-- contentent d'INSÉRER une ligne dans `notification_outbox`. Un Database Webhook
-- Supabase (INSERT sur cette table) appelle ensuite l'Edge Function `send-sms`,
-- qui contacte la passerelle Sendtext et met à jour le statut de la ligne.
-- Découplage = aucune demande d'achat bloquée si le SMS échoue.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FILE D'ATTENTE SMS
-- -----------------------------------------------------------------------------
create table if not exists public.notification_outbox (
  id              uuid primary key default gen_random_uuid (),
  recipient_phone text not null,
  body            text not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'sent', 'failed')),
  attempts        int  not null default 0,
  provider_ref    text,                 -- id renvoyé par Sendtext
  last_error      text,
  related_request uuid references public.purchase_requests (id) on delete set null,
  related_user    uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);

-- Index pour la relance des envois en échec / en attente.
create index if not exists notification_outbox_status_idx
  on public.notification_outbox (status, created_at);

-- RLS activée SANS aucune policy : la table est inaccessible aux clés anon/auth.
-- Seul le service_role (Edge Function) et les triggers SECURITY DEFINER y
-- accèdent. Les numéros de téléphone ne fuient jamais côté client.
alter table public.notification_outbox enable row level security;

-- -----------------------------------------------------------------------------
-- Helper : empile un SMS (numéro nullable -> ignoré proprement)
-- -----------------------------------------------------------------------------
create or replace function public.enqueue_sms (
  p_phone   text,
  p_body    text,
  p_user    uuid default null,
  p_request uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_phone is null or btrim(p_phone) = '' then
    return; -- destinataire sans téléphone : on n'empile rien.
  end if;
  insert into public.notification_outbox (recipient_phone, body, related_user, related_request)
  values (btrim(p_phone), p_body, p_user, p_request);
end;
$$;

-- -----------------------------------------------------------------------------
-- [PRODUCTEUR] Nouvelle demande d'achat reçue
-- -----------------------------------------------------------------------------
create or replace function public.notify_producer_on_request ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_title text;
  v_producer_user uuid;
  v_producer_phone text;
begin
  select l.title, pp.user_id
    into v_listing_title, v_producer_user
    from public.listings l
    join public.producer_profiles pp on pp.id = l.producer_id
   where l.id = new.listing_id;

  if v_producer_user is null then
    return new;
  end if;

  -- Notification in-app (cloche).
  insert into public.notifications (user_id, type, message)
  values (
    v_producer_user,
    'purchase_request',
    'Nouvelle demande d''achat sur « ' || coalesce(v_listing_title, 'votre annonce') || ' ».'
  );

  -- SMS.
  select phone into v_producer_phone from public.profiles where id = v_producer_user;
  perform public.enqueue_sms (
    v_producer_phone,
    'AgriLien: nouvelle demande sur "' || coalesce(v_listing_title, 'votre annonce')
      || '". Connectez-vous pour repondre.',
    v_producer_user,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists requests_notify_producer on public.purchase_requests;
create trigger requests_notify_producer
  after insert on public.purchase_requests
  for each row execute function public.notify_producer_on_request ();

-- -----------------------------------------------------------------------------
-- [ACHETEUR] Réponse du producteur (acceptée / refusée)
-- -----------------------------------------------------------------------------
create or replace function public.notify_buyer_on_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_title text;
  v_buyer_phone text;
  v_label text;
begin
  -- On ne notifie que les transitions vers une décision.
  if new.status is not distinct from old.status
     or new.status not in ('acceptee', 'refusee', 'terminee') then
    return new;
  end if;

  v_label := case new.status
    when 'acceptee'  then 'acceptee'
    when 'refusee'   then 'refusee'
    when 'terminee'  then 'finalisee'
  end;

  select l.title into v_listing_title
    from public.listings l where l.id = new.listing_id;

  insert into public.notifications (user_id, type, message)
  values (
    new.buyer_id,
    'request_status',
    'Votre demande sur « ' || coalesce(v_listing_title, 'une annonce') || ' » a été ' || v_label || '.'
  );

  select phone into v_buyer_phone from public.profiles where id = new.buyer_id;
  perform public.enqueue_sms (
    v_buyer_phone,
    'AgriLien: votre demande sur "' || coalesce(v_listing_title, 'une annonce')
      || '" a ete ' || v_label || '.',
    new.buyer_id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists requests_notify_buyer on public.purchase_requests;
create trigger requests_notify_buyer
  after update on public.purchase_requests
  for each row execute function public.notify_buyer_on_status ();

-- =============================================================================
-- RELANCE AUTOMATIQUE (optionnel — nécessite les extensions pg_cron + pg_net)
-- -----------------------------------------------------------------------------
-- Décommentez ce bloc APRÈS avoir activé pg_cron et pg_net dans
-- Database > Extensions, et remplacé <PROJECT_REF> + <CRON_SECRET>.
-- Il relance l'Edge Function pour les SMS bloqués (pending/failed, <3 essais),
-- toutes les 5 minutes.
-- =============================================================================
-- create extension if not exists pg_net;
-- create extension if not exists pg_cron;
--
-- select cron.schedule(
--   'retry-sms-outbox',
--   '*/5 * * * *',
--   $$
--     select net.http_post(
--       url     := 'https://<PROJECT_REF>.functions.supabase.co/send-sms',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', '<CRON_SECRET>'
--       ),
--       body    := jsonb_build_object('mode', 'retry')
--     )
--     -- (l'Edge Function en mode "retry" balaie les lignes pending/failed)
--   $$
-- );

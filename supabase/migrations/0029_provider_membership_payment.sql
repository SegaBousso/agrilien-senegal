-- =============================================================================
-- AgriLien Sénégal — Paiement réel de l'adhésion « Partenaire »
-- Migration 0029 — Le prestataire paie lui-même son adhésion via PayTech ;
-- l'activation est automatique à la confirmation du paiement.
--
-- Réutilise tout le pipeline existant (table transactions + Edge Functions
-- payment-initiate/payment-ipn). Une transaction d'adhésion se distingue par
-- kind = 'membership' (au lieu de 'acompte') et porte provider_id + le nombre
-- de jours achetés. L'IPN, qui ne réserve du stock que lorsqu'il y a un
-- request_id, marque simplement la transaction 'paye' ; c'est un trigger qui
-- active alors l'adhésion. AUCUNE modification de payment-ipn n'est nécessaire.
--
-- Idempotent.
-- =============================================================================

alter table public.transactions
  add column if not exists kind text not null default 'acompte'
    check (kind in ('acompte', 'membership')),
  add column if not exists provider_id uuid references public.service_providers (id) on delete set null,
  add column if not exists membership_days integer;

create index if not exists transactions_provider_idx on public.transactions (provider_id);

-- -----------------------------------------------------------------------------
-- enforce_provider_status : on laisse passer les écritures serveur de confiance
-- (service_role / contexte interne où auth.uid() est null) afin que le trigger
-- d'activation puisse poser membership_active. Le prestataire (auth.uid() non
-- null, non admin) reste incapable de s'auto-adhérer ; l'anonyme est déjà bloqué
-- par les politiques RLS d'écriture.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_provider_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin () or auth.uid () is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verification_status := 'non_verifie';
    new.verification_notes  := null;
    new.membership_active   := false;
    new.membership_until    := null;
  elsif tg_op = 'UPDATE' then
    if new.verification_status is distinct from old.verification_status then
      if not (old.verification_status in ('non_verifie', 'rejete')
              and new.verification_status = 'en_attente') then
        raise exception 'Transition de vérification non autorisée.' using errcode = '42501';
      end if;
      new.verification_notes := null;
    end if;
    new.membership_active := old.membership_active;
    new.membership_until  := old.membership_until;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- notify_on_payment : ne concerne QUE les acomptes (kind = 'acompte'). On évite
-- d'envoyer le message « contactez le producteur » pour une adhésion. (Reprise
-- intégrale de 0011 + garde sur kind.)
-- -----------------------------------------------------------------------------
create or replace function public.notify_on_payment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_title  text;
  v_producer_user  uuid;
  v_producer_name  text;
  v_producer_phone text;
  v_buyer_name     text;
  v_buyer_phone    text;
begin
  if new.status is not distinct from old.status or new.status <> 'paye' then
    return new;
  end if;
  if new.kind is distinct from 'acompte' then
    return new; -- les adhésions sont gérées par activate_membership_on_payment
  end if;

  select l.title, pp.user_id
    into v_listing_title, v_producer_user
    from public.purchase_requests r
    join public.listings l on l.id = r.listing_id
    join public.producer_profiles pp on pp.id = l.producer_id
   where r.id = new.request_id;

  select full_name, phone into v_producer_name, v_producer_phone
    from public.profiles where id = v_producer_user;
  select full_name, phone into v_buyer_name, v_buyer_phone
    from public.profiles where id = new.buyer_id;

  insert into public.notifications (user_id, type, message)
  values (
    new.buyer_id,
    'payment_confirmed',
    'Acompte de ' || new.amount || ' FCFA payé ✓ Contactez le producteur '
      || coalesce(v_producer_name, '') || ' : ' || coalesce(v_producer_phone, 'numéro indisponible')
      || ' pour organiser la livraison.'
  );
  perform public.enqueue_sms (
    v_buyer_phone,
    'AgriLien: acompte paye. Producteur ' || coalesce(v_producer_name, '')
      || ' ' || coalesce(v_producer_phone, '') || '. Organisez la livraison.',
    new.buyer_id,
    new.request_id
  );

  if v_producer_user is not null then
    insert into public.notifications (user_id, type, message)
    values (
      v_producer_user,
      'payment_received',
      'Acompte reçu pour « ' || coalesce(v_listing_title, 'votre annonce')
        || ' ». Acheteur ' || coalesce(v_buyer_name, '') || ' : '
        || coalesce(v_buyer_phone, 'numéro indisponible') || '. Contactez-le pour la livraison.'
    );
    perform public.enqueue_sms (
      v_producer_phone,
      'AgriLien: acompte recu pour "' || coalesce(v_listing_title, 'votre annonce')
        || '". Acheteur ' || coalesce(v_buyer_name, '') || ' ' || coalesce(v_buyer_phone, '')
        || '. Contactez-le.',
      v_producer_user,
      new.request_id
    );
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Activation de l'adhésion quand une transaction 'membership' passe à 'paye'.
-- Prolonge à partir de la date d'échéance en cours si elle est future (cumul).
-- -----------------------------------------------------------------------------
create or replace function public.activate_membership_on_payment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until date;
  v_user  uuid;
  v_phone text;
  v_name  text;
  v_days  integer := coalesce(new.membership_days, 30);
begin
  if new.kind is distinct from 'membership' then
    return new;
  end if;
  if new.status is not distinct from old.status or new.status <> 'paye' then
    return new;
  end if;
  if new.provider_id is null then
    return new;
  end if;

  update public.service_providers sp
     set membership_active = true,
         membership_until = (
           greatest(coalesce(sp.membership_until, current_date), current_date)
           + make_interval(days => v_days)
         )::date
   where sp.id = new.provider_id
   returning sp.membership_until, sp.user_id, sp.name into v_until, v_user, v_name;

  if v_user is not null then
    insert into public.notifications (user_id, type, message)
    values (
      v_user,
      'service',
      'Adhésion « Partenaire » activée ✓ Votre service « ' || coalesce(v_name, '')
        || ' » est mis en avant au Carnet jusqu''au ' || to_char(v_until, 'DD/MM/YYYY') || '.'
    );
    select phone into v_phone from public.profiles where id = v_user;
    perform public.enqueue_sms (
      v_phone,
      'AgriLien: adhesion Partenaire active jusqu au ' || to_char(v_until, 'DD/MM/YYYY') || '. Merci.',
      v_user,
      null
    );
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_activate_membership on public.transactions;
create trigger transactions_activate_membership
  after update on public.transactions
  for each row execute function public.activate_membership_on_payment ();

-- -----------------------------------------------------------------------------
-- Expiration : repasse à false les adhésions échues. À planifier quotidiennement
-- (pg_cron si disponible ; sinon appel manuel ou planification ultérieure).
-- -----------------------------------------------------------------------------
create or replace function public.expire_memberships ()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.service_providers
     set membership_active = false
   where membership_active
     and membership_until is not null
     and membership_until < current_date;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'expire-memberships-daily',
      '15 0 * * *',
      $cron$ select public.expire_memberships(); $cron$
    );
  end if;
exception when others then
  -- pg_cron absent ou non autorisé : la fonction reste appelable manuellement.
  null;
end $$;

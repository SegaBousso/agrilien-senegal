-- =============================================================================
-- AgriLien Sénégal — Modèle d'acompte : déblocage du contact au paiement
-- Migration 0011 : remplace notify_on_payment (0007). Quand l'ACOMPTE est payé
-- (transactions.status -> 'paye'), on notifie les deux parties ET on leur
-- transmet le contact de l'autre (nom + téléphone) pour organiser la livraison
-- et régler le solde en direct. Réutilise enqueue_sms (0006).
-- =============================================================================

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

  -- Producteur (via demande -> annonce -> profil producteur).
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

  -- --- Acheteur : acompte confirmé + contact du producteur -----------------
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

  -- --- Producteur : acompte reçu + contact de l'acheteur -------------------
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

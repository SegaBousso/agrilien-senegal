-- =============================================================================
-- AgriLien Sénégal — Réservation de stock atomique (anti-survente)
-- Migration 0020 : remplace le décrément « best-effort » de la 0018 par une
-- réservation ATOMIQUE et CONDITIONNELLE déclenchée par l'Edge Function
-- `payment-ipn` au moment où l'acompte est confirmé.
--
-- Problème résolu : deux acheteurs payaient le même stock quasi simultanément
-- et le second était « survendu » (quantité clampée à 0). Désormais un seul
-- paiement peut faire passer la quantité sous le seuil ; l'autre est détecté
-- et sa transaction passe 'a_rembourser'.
--
-- Pré-requis : exécuter d'abord la 0019 (ajout de la valeur d'enum), dans une
-- transaction distincte.
-- =============================================================================

-- 1) On retire le trigger best-effort de la 0018 : la décrémentation est
--    désormais pilotée explicitement par l'IPN via try_reserve_stock().
drop trigger if exists transactions_decrement_stock on public.transactions;
drop function if exists public.decrement_stock_on_payment ();

-- 2) Réservation atomique. Renvoie true si le stock a pu être réservé.
--    Le `where quantity >= v_qty` + verrou de ligne Postgres sérialise les
--    paiements concurrents : un seul franchit la condition, l'autre obtient
--    0 ligne (→ false). Aucune survente possible.
create or replace function public.try_reserve_stock (p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_qty        numeric;
  v_done       uuid;
begin
  select r.listing_id, r.quantity_requested
    into v_listing_id, v_qty
    from public.purchase_requests r
   where r.id = p_request_id;

  -- Demande sans annonce rattachée (annonce supprimée) : on ne bloque pas le
  -- paiement (rien à réserver), l'acompte reste valable.
  if v_listing_id is null or v_qty is null then
    return true;
  end if;

  -- Dans les expressions SET, `quantity` désigne la valeur AVANT mise à jour ;
  -- `quantity - v_qty` est donc le nouveau stock. Statut 'vendue' à 0.
  update public.listings
     set quantity = quantity - v_qty,
         status = case
                    when quantity - v_qty = 0 then 'vendue'::listing_status
                    else status
                  end
   where id = v_listing_id
     and quantity >= v_qty
  returning id into v_done;

  return v_done is not null;
end;
$$;

revoke all on function public.try_reserve_stock (uuid) from public, anon, authenticated;

-- 3) Notification quand une transaction passe 'a_rembourser' : on alerte les
--    administrateurs (à rembourser) et on rassure l'acheteur. Le contact N'EST
--    PAS débloqué (notify_on_payment ne réagit qu'au passage 'paye').
create or replace function public.notify_on_refund_needed ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin      record;
  v_buyer_name text;
begin
  if new.status is not distinct from old.status or new.status <> 'a_rembourser' then
    return new;
  end if;

  select full_name into v_buyer_name from public.profiles where id = new.buyer_id;

  for v_admin in select id from public.profiles where role = 'admin'
  loop
    insert into public.notifications (user_id, type, message)
    values (
      v_admin.id,
      'refund_needed',
      'Acompte à rembourser : ' || new.amount || ' FCFA payé par '
        || coalesce(v_buyer_name, 'un acheteur')
        || ' alors que le stock était épuisé (réf. ' || new.ref_command || ').'
    );
  end loop;

  insert into public.notifications (user_id, type, message)
  values (
    new.buyer_id,
    'refund_needed',
    'Le stock vient d''être épuisé. Votre acompte de ' || new.amount
      || ' FCFA vous sera remboursé : notre équipe vous contacte.'
  );

  return new;
end;
$$;

drop trigger if exists transactions_notify_refund on public.transactions;
create trigger transactions_notify_refund
  after update on public.transactions
  for each row execute function public.notify_on_refund_needed ();

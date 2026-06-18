-- =============================================================================
-- AgriLien Sénégal — Mise à jour du stock au paiement de l'acompte
-- Migration 0018 : le stock (listings.quantity) ne se décrémentait jamais.
-- On décrémente à l'ENGAGEMENT = paiement de l'acompte (transaction 'paye'),
-- pas à la demande (qui peut être refusée). À 0, l'annonce passe 'vendue'.
-- =============================================================================

-- Le stock peut désormais atteindre 0 (contrainte d'origine : quantity > 0).
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.listings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%quantity%'
  loop
    execute format('alter table public.listings drop constraint %I', c);
  end loop;
end $$;

alter table public.listings
  add constraint listings_quantity_check check (quantity >= 0);

-- Décrémente le stock quand l'acompte est confirmé.
create or replace function public.decrement_stock_on_payment ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_qty        numeric;
begin
  if new.status is not distinct from old.status or new.status <> 'paye' then
    return new;
  end if;

  select r.listing_id, r.quantity_requested
    into v_listing_id, v_qty
    from public.purchase_requests r
   where r.id = new.request_id;

  if v_listing_id is null then
    return new;
  end if;

  -- greatest(0, ...) : évite tout stock négatif (cas d'achats concurrents).
  -- Le statut passe 'vendue' quand le stock atteint 0.
  update public.listings
     set quantity = greatest(0, quantity - v_qty),
         status = case when greatest(0, quantity - v_qty) = 0 then 'vendue'::listing_status else status end
   where id = v_listing_id;

  return new;
end;
$$;

drop trigger if exists transactions_decrement_stock on public.transactions;
create trigger transactions_decrement_stock
  after update on public.transactions
  for each row execute function public.decrement_stock_on_payment ();

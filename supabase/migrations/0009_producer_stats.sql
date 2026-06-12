-- =============================================================================
-- AgriLien Sénégal — Statistiques d'impact PRODUCTEUR (RPC SECURITY DEFINER)
-- Migration 0009 : chaque producteur ne voit que SES propres chiffres, via
-- current_producer_id() (aucune fuite inter-producteurs).
-- =============================================================================

create or replace function public.producer_impact_stats ()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pid uuid;
  result json;
begin
  pid := public.current_producer_id ();
  if pid is null then
    raise exception 'Profil producteur requis.' using errcode = '42501';
  end if;

  select json_build_object(
    'pertes_evitees_kg', coalesce((
      select sum(r.quantity_requested)
      from public.purchase_requests r
      join public.listings l on l.id = r.listing_id
      where l.producer_id = pid and r.status in ('acceptee', 'terminee')), 0),
    'revenu_paye', coalesce((
      select sum(t.amount)
      from public.transactions t
      join public.purchase_requests r on r.id = t.request_id
      join public.listings l on l.id = r.listing_id
      where l.producer_id = pid and t.status = 'paye'), 0),
    'transactions_payees', (
      select count(*)
      from public.transactions t
      join public.purchase_requests r on r.id = t.request_id
      join public.listings l on l.id = r.listing_id
      where l.producer_id = pid and t.status = 'paye'),
    'demandes_recues', (
      select count(*)
      from public.purchase_requests r
      join public.listings l on l.id = r.listing_id
      where l.producer_id = pid),
    'taux_acceptation', (
      select case when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where r.status in ('acceptee', 'terminee')) / count(*), 1)
      end
      from public.purchase_requests r
      join public.listings l on l.id = r.listing_id
      where l.producer_id = pid)
  ) into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Revenu encaissé par mois (transactions payées), N derniers mois.
-- -----------------------------------------------------------------------------
create or replace function public.producer_revenue_trend (p_months int default 6)
returns table (label text, value numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid := public.current_producer_id ();
  if pid is null then
    raise exception 'Profil producteur requis.' using errcode = '42501';
  end if;

  return query
    select to_char(date_trunc('month', t.paid_at), 'MM/YYYY') as label,
           sum(t.amount) as value
    from public.transactions t
    join public.purchase_requests r on r.id = t.request_id
    join public.listings l on l.id = r.listing_id
    where l.producer_id = pid
      and t.status = 'paye'
      and t.paid_at is not null
      and t.paid_at >= date_trunc('month', now()) - make_interval(months => p_months - 1)
    group by date_trunc('month', t.paid_at)
    order by date_trunc('month', t.paid_at);
end;
$$;

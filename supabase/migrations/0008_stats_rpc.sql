-- =============================================================================
-- AgriLien Sénégal — Statistiques d'impact (fonctions RPC SECURITY DEFINER)
-- Migration 0008 : agrégations calculées en base (rapides, indexées) plutôt
-- que côté client. Réservées aux administrateurs (garde is_admin()).
-- Appel côté front : supabase.rpc('admin_impact_stats') etc.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Indicateurs d'impact globaux (carte de synthèse).
--   pertes_evitees_kg : quantité ayant trouvé preneur (demandes acceptées /
--   terminées) = produit sauvé du gaspillage plutôt que perdu au champ.
-- -----------------------------------------------------------------------------
create or replace function public.admin_impact_stats ()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  select json_build_object(
    'pertes_evitees_kg', coalesce((
      select sum(quantity_requested) from public.purchase_requests
      where status in ('acceptee', 'terminee')), 0),
    'volume_demande_kg', coalesce((
      select sum(quantity_requested) from public.purchase_requests), 0),
    'transactions_payees', (
      select count(*) from public.transactions where status = 'paye'),
    'montant_paye', coalesce((
      select sum(amount) from public.transactions where status = 'paye'), 0),
    'taux_acceptation', (
      select case when count(*) = 0 then 0
        else round(100.0 * count(*) filter (where status in ('acceptee', 'terminee')) / count(*), 1)
      end
      from public.purchase_requests),
    'producteurs_actifs', (
      select count(distinct producer_id) from public.listings where status = 'publiee')
  ) into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Évolution du prix moyen des annonces, par mois, sur les N derniers mois.
-- -----------------------------------------------------------------------------
create or replace function public.admin_price_trend (p_months int default 6)
returns table (label text, avg_price numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  return query
    select to_char(date_trunc('month', l.created_at), 'MM/YYYY') as label,
           round(avg(l.price)) as avg_price
    from public.listings l
    where l.created_at >= date_trunc('month', now()) - make_interval(months => p_months - 1)
    group by date_trunc('month', l.created_at)
    order by date_trunc('month', l.created_at);
end;
$$;

-- -----------------------------------------------------------------------------
-- Volume échangé (pertes évitées) par catégorie de produit.
-- -----------------------------------------------------------------------------
create or replace function public.admin_volume_by_category ()
returns table (category text, volume numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin () then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;

  return query
    select coalesce(c.name, 'Sans catégorie') as category,
           sum(r.quantity_requested) as volume
    from public.purchase_requests r
    join public.listings l on l.id = r.listing_id
    left join public.product_categories c on c.id = l.category_id
    where r.status in ('acceptee', 'terminee')
    group by c.name
    order by sum(r.quantity_requested) desc;
end;
$$;

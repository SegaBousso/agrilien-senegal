-- =============================================================================
-- AgriLien Sénégal — Suivi des opérations InTech API V2
-- Migration 0010 : table de corrélation des transactions InTech.
--
-- Source unique : https://doc.intech.sn/doc_intech_api.php + collection Postman.
-- La corrélation init <-> callback se fait via `external_transaction_id`
-- (champ `externalTransactionId` envoyé à InTech, renvoyé dans le callback).
--
-- Statuts documentés (get-transaction-status) :
--   PENDING | PROCESSING | SUCCESS | FAILLED | REFUNDED | CANCELED
-- (NB : "FAILLED" avec deux L = orthographe exacte de la doc.)
-- =============================================================================

create table if not exists public.intech_transactions (
  id                       uuid primary key default gen_random_uuid (),
  external_transaction_id  text not null unique,        -- notre référence
  intech_transaction_id    text,                        -- transactionId renvoyé par InTech
  code_service             text not null,               -- ex. WAVE_SN_API_CASH_IN
  direction                text not null,               -- 'cashin' | 'cashout' | 'autre'
  phone                    text,
  amount                   numeric(12, 2),
  status                   text not null default 'PENDING',
  user_id                  uuid references public.profiles (id) on delete set null,
  request_id               uuid references public.purchase_requests (id) on delete set null,
  data                     jsonb,                        -- champ `data` renvoyé dans le callback
  error_type               jsonb,                        -- objet errorType en cas d'échec
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists intech_tx_user_idx on public.intech_transactions (user_id);
create index if not exists intech_tx_status_idx on public.intech_transactions (status);

create trigger intech_transactions_updated_at
  before update on public.intech_transactions
  for each row execute function public.set_updated_at ();

-- RLS : lecture de ses propres opérations ; écritures réservées au service_role
-- (Edge Functions). La clé API InTech ne transite jamais côté client.
alter table public.intech_transactions enable row level security;

create policy "Utilisateur voit ses operations intech"
  on public.intech_transactions for select using (user_id = auth.uid ());

create policy "Admin voit toutes les operations intech"
  on public.intech_transactions for select using (public.is_admin ());

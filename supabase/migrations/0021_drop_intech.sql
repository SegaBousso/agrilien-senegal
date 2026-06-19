-- =============================================================================
-- AgriLien Sénégal — Retrait complet d'InTech
-- Migration 0021 : InTech (API V2) a été suspendu au profit de PayTech. On
-- supprime la table de corrélation et son trigger devenus inutiles. Les Edge
-- Functions intech-operation / intech-callback ont été supprimées côté cloud.
--
-- Idempotent : `drop … if exists`.
-- =============================================================================

drop trigger if exists intech_transactions_updated_at on public.intech_transactions;
drop table if exists public.intech_transactions;

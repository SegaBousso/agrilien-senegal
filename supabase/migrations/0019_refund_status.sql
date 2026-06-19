-- =============================================================================
-- AgriLien Sénégal — Statut « à rembourser »
-- Migration 0019 : ajoute la valeur 'a_rembourser' à l'enum payment_status.
--
-- Cas d'usage : course à l'achat (deux acompteurs quasi simultanés sur le même
-- stock). Le perdant a payé mais le stock vient d'être épuisé → sa transaction
-- passe 'a_rembourser' (cf. migration 0020) et un administrateur le rembourse.
--
-- ⚠️ À EXÉCUTER SEUL, avant 0020 : une nouvelle valeur d'enum ne peut pas être
-- utilisée dans la même transaction que son ajout. La 0020 (qui s'en sert au
-- moment de l'exécution) doit donc être lancée séparément, après celle-ci.
-- =============================================================================

alter type payment_status add value if not exists 'a_rembourser';

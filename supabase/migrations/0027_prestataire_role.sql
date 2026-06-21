-- =============================================================================
-- AgriLien Sénégal — Rôle « prestataire de services »
-- Migration 0027 — Ajoute la valeur d'enum 'prestataire' à user_role.
--
-- IMPORTANT : `alter type ... add value` NE PEUT PAS être utilisé dans la même
-- transaction que la valeur qu'il ajoute. Cette migration est donc ISOLÉE — à
-- exécuter AVANT 0028 (qui s'appuie sur 'prestataire' dans handle_new_user et
-- les politiques). Même précaution que 0019.
-- =============================================================================

alter type user_role add value if not exists 'prestataire';

# Edge Function `send-sms` — Notifications SMS (Sendtext SN)

Envoie les SMS empilés dans la table `notification_outbox` (cf. migration
`0006_sms_notifications.sql`) via la passerelle **Sendtext** (`api.sendtext.sn`).

## Architecture

```
purchase_requests  ──(trigger AFTER INSERT/UPDATE)──►  notification_outbox
        │                                                     │
        │                                          Database Webhook (INSERT)
        │                                                     ▼
        │                                          Edge Function  send-sms
        │                                                     │  POST /v1/sms
        │                                                     ▼
        └───────────────────────────────────────►   Passerelle Sendtext SN
                                                              │
                                          UPDATE outbox.status = sent | failed
```

Le SQL ne fait **aucun appel réseau** : une demande d'achat n'est jamais bloquée
si le SMS échoue. La relance des échecs est gérée par le mode `retry` (cron).

## 1. Appliquer la migration

Exécuter `supabase/migrations/0006_sms_notifications.sql` dans le SQL Editor.

## 2. Renseigner les secrets

Dashboard → **Edge Functions → Secrets** (ou CLI) :

```bash
supabase secrets set \
  SENDTEXT_API_KEY=xxxxx \
  SENDTEXT_API_SECRET=xxxxx \
  SENDTEXT_SENDER_NAME=AgriLien \
  CRON_SECRET=$(openssl rand -hex 24)
```

> `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.
> ⚠️ La clé `service_role` reste **uniquement** côté Edge Function — jamais dans le front.

## 3. Déployer

```bash
supabase functions deploy send-sms --no-verify-jwt
```

`--no-verify-jwt` : le webhook appelle la fonction sans JWT utilisateur.
L'accès aux données reste protégé par la clé `service_role` côté serveur, et le
mode `retry` exige l'en-tête `x-cron-secret`.

## 4. Brancher le Database Webhook

Dashboard → **Database → Webhooks → Create a new hook** :

- **Table** : `public.notification_outbox`
- **Events** : `INSERT`
- **Type** : Supabase Edge Functions → `send-sms`
- (méthode `POST`, le payload `{ type, record, ... }` est envoyé automatiquement)

## 5. (Optionnel) Relance automatique des échecs

Activer `pg_cron` + `pg_net` (Database → Extensions), puis décommenter le bloc
`cron.schedule(...)` en bas de la migration `0006` (remplacer `<PROJECT_REF>` et
`<CRON_SECRET>`). La fonction est alors rappelée toutes les 5 min en mode
`retry` pour vider les SMS `pending`/`failed` (< 3 tentatives).

## Format des numéros

`normalizePhone()` accepte `77xxxxxxx`, `221xxxxxxxxx`, `+221…`, `00221…` et
les normalise en `221XXXXXXXXX` (format exigé par Sendtext). Un numéro non
reconnu marque la ligne `failed` avec `last_error`, sans bloquer le reste.

## Test manuel

```bash
# Empiler un SMS de test (SQL Editor) :
insert into public.notification_outbox (recipient_phone, body)
values ('221771234567', 'AgriLien: test envoi SMS.');
# -> le webhook déclenche l'envoi ; vérifier status='sent' et provider_ref.
```

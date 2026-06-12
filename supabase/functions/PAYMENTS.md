# Paiements mobiles — PayTech (Orange Money, Wave, …)

Agrégateur unique couvrant Orange Money, Wave, Free Money, cartes bancaires, etc.
Tout l'échange se fait **côté serveur** (PayTech n'autorise pas le CORS).

## Architecture

```
Acheteur "Payer" (demande acceptee)
   │  supabase.functions.invoke('payment-initiate', { request_id })
   ▼
Edge Function payment-initiate  (JWT verifie)
   • recalcule le MONTANT (quantite × prix) — jamais transmis par le client
   • cree transactions(status=initie)
   • POST paytech.sn/api/payment/request-payment
   │◄── { redirect_url }
   ▼
window.location -> checkout PayTech (Orange Money / Wave / …)
   ├─ succes  -> APP_URL/paiement/succes
   ├─ annule  -> APP_URL/paiement/annule
   ▼
IPN (serveur->serveur) -> Edge Function payment-ipn  (--no-verify-jwt)
   • verifie SHA256(api_key)/SHA256(api_secret)
   • transactions -> paye | annule
   • trigger SQL notify_on_payment -> notifs in-app + SMS (acheteur + producteur)
```

**Sécurité clé** : le client n'envoie que `request_id`. Le montant est recalculé
serveur depuis la demande d'achat → impossible de payer un montant arbitraire.
Aucune policy RLS d'écriture sur `transactions` : seules les Edge Functions
(service_role) écrivent.

## 1. Migration

Exécuter `supabase/migrations/0007_payments.sql` dans le SQL Editor.
(Nécessite `0006` déjà appliquée — réutilise `enqueue_sms`.)

## 2. Secrets

```bash
supabase secrets set \
  PAYTECH_API_KEY=xxxxx \
  PAYTECH_API_SECRET=xxxxx \
  PAYTECH_ENV=test \
  APP_URL=https://ton-domaine-front
```
> `PAYTECH_ENV=test` : PayTech ne débite qu'un montant aléatoire 100–150 FCFA
> quel que soit le montant réel. Passer à `prod` après validation du compte.
> `APP_URL` = base du front (sans slash final) pour les pages de retour.

## 3. Déploiement

```bash
supabase functions deploy payment-initiate            # JWT verifie (acheteur)
supabase functions deploy payment-ipn --no-verify-jwt # appele par PayTech
```

## 4. IPN

Aucune config dashboard : l'`ipn_url` est transmise à chaque requête
(`<SUPABASE_URL>/functions/v1/payment-ipn`). Vérifie juste dans ton espace
PayTech que les notifications IPN sont activées.

## Test (env=test)

1. Acheteur connecté → une demande au statut **acceptée** → bouton **Payer**.
2. Redirection PayTech → choisir Orange Money/Wave (sandbox) → payer ~100 FCFA.
3. Retour sur `/paiement/succes`. L'IPN passe la transaction en `paye` :
   ```sql
   select ref_command, status, payment_method, amount, paid_at
   from public.transactions order by created_at desc limit 1;
   ```
4. L'acheteur ET le producteur reçoivent notif in-app + SMS (via `0006`).

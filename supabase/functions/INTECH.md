# Intégration InTech API V2

> Source **unique et exclusive** : <https://doc.intech.sn/doc_intech_api.php>
> et la collection Postman « Intech API V2 ». Tout point absent de ces sources
> est signalé « ⚠️ NON DOCUMENTÉ ».

## 1. Configuration

| Élément | Valeur (doc) |
|---|---|
| Base URL prod | `https://api.intech.sn` |
| Base URL sandbox | ⚠️ NON DOCUMENTÉ (seule la prod est donnée) |
| Auth requêtes **GET** | en-tête `Secretkey: <clé API>` |
| Auth requêtes **POST** | champ **du corps** `apiKey: <clé API>` |
| Timeout HTTP | ≥ 60 s |
| Devise par défaut | XOF |

### Secrets (Edge Functions)
```bash
supabase secrets set INTECH_API_KEY=xxxxx
supabase secrets set INTECH_BASE_URL=https://api.intech.sn
```

### Déploiement
```bash
supabase functions deploy intech-operation --no-verify-jwt
supabase functions deploy intech-callback  --no-verify-jwt
```
Et exécuter la migration `0010_intech_transactions.sql`.

## 2. Endpoint principal (toutes opérations)

`POST {base}/api-services/operation` — corps commun (doc §4) :
```json
{
  "phone": "770000000",
  "amount": 100,
  "codeService": "WAVE_SN_API_CASH_IN",
  "externalTransactionId": "ref-unique",
  "callbackUrl": "https://.../functions/v1/intech-callback",
  "apiKey": "<clé>",
  "data": "{}"
}
```
> ⚠️ Écart de doc : la page §4 dit que `data` doit être une **chaîne JSON
> sérialisée** ; la collection Postman l'envoie comme **objet** `{}`. On suit la
> page (chaîne) dans `intech-operation`. À confirmer avec le support InTech.

Réponse OK (doc §6) : `code === 2000`, `data.transactionId`, `data.status = "PENDING"`.
Certains services ajoutent `authLinkUrl` (carte) ou `deepLinkUrl` (Wave/OM).

## 3. Exemples par type de service (codeService)

### CASHIN — encaisser (l'acheteur paie)
`WAVE_SN_API_CASH_IN`, `ORANGE_SN_API_CASH_IN`, `FREE_SN_WALLET_CASH_IN`, `WIZALL_SN_API_CASH_IN`, `BANK_TRANSFER_SN_API_CASH_IN`, … (liste complète doc §4).
```json
{ "codeService": "WAVE_SN_API_CASH_IN", "phone": "770000000", "amount": 100,
  "useOMQrCode": true, "sender": "AgriLien" }
```

### CASHOUT — décaisser (reverser au producteur) — SERVEUR UNIQUEMENT
`WAVE_SN_API_CASH_OUT`, `ORANGE_SN_API_CASH_OUT`, `BANK_CARD_API_CASH_OUT`, …
```json
{ "codeService": "ORANGE_SN_API_CASH_OUT", "phone": "770000000", "amount": 5000,
  "sender": "AgriLien", "successRedirectUrl": "https://...", "errorRedirectUrl": "https://..." }
```
> ⚠️ `BANK_CARD_API_CASH_OUT` et `WHATSAPP_MESSAGING` exigent le numéro au
> format **international** `+221770000000` (doc §4). Le cash-out n'est JAMAIS
> exposé au client (cf. `ALLOWED_CLIENT_SERVICES` dans `intech-operation`).

### CREDIT_TELEPHONIQUE — recharge crédit
`ORANGE_SN_AIRTIME_CREDIT_TELEPHONIQUE`, `FREE_SN_AIRTIME_CREDIT_TELEPHONIQUE`, …
```json
{ "codeService": "ORANGE_SN_AIRTIME_CREDIT_TELEPHONIQUE", "phone": "770000000", "amount": 500 }
```

### BILL_PAY — paiement de facture (2 étapes)
1) Lister les factures impayées :
`POST {base}/api-services/list-pending-bills`
```json
{ "apiKey": "<clé>", "codeService": "SENELEC_SN_BILL_PAY", "billAccountNumber": "21014106874" }
```
2) Puis `operation` avec la référence obtenue :
```json
{ "codeService": "SENELEC_SN_BILL_PAY", "phone": "770000000", "amount": 5000,
  "accountNumber": "21014106874", "billReference": "<ref de l'étape 1>" }
```

### MESSENGING_SMS — messagerie
> ⚠️ Le seul code de messagerie documenté est **`WHATSAPP_MESSAGING`** (WhatsApp,
> pas SMS). Aucun code « SMS pur » n'apparaît dans les sources InTech fournies.
> (Pour le SMS, AgriLien utilise déjà Sendtext — cf. `send-sms`.)
```json
{ "codeService": "WHATSAPP_MESSAGING", "phone": "+221772450000",
  "message": "Bonjour depuis AgriLien",
  "attachedMediaExtension": ".png", "attachedMediaName": "Doc",
  "attachedMedia": "<base64>" }
```

## 4. Callback / webhook (SHA256)

InTech `POST` vers `callbackUrl` (doc §7). Réponse **HTTP 200 obligatoire**
(sinon relance après 1 min). Payload :
```json
{ "msg": "...", "status": "SUCCESS",
  "sha256Hash": "<hash>",
  "transaction": { "transactionId": "2313499724668",
    "externalTransactionId": "ref-unique", "amount": 100,
    "codeService": "...", "errorType": null, "data": {} } }
```
Vérification d'authenticité (formule exacte doc §7) :
```
sha256Hash == SHA256( transactionId + "|" + externalTransactionId + "|" + apiKey )
```
Implémenté dans `intech-callback` (Web Crypto). Statuts : `SUCCESS` | `FAILLED`.

## 5. Suivi de statut

`POST {base}/api-services/get-transaction-status` `{ "externalTransactionId": "..." }`
→ statut ∈ `PENDING|PROCESSING|SUCCESS|FAILLED|REFUNDED|CANCELED`.
> ⚠️ Limite : **≤ 3 appels/min** par transaction (sinon blacklist IP). Le front
> lit donc NOTRE table (mise à jour par le callback), pas cet endpoint.

## 6. Autres endpoints documentés
- `GET /api-services/balance` (en-tête `Secretkey`) — solde.
- `GET /api-services/services` / `GET /api-services/errors` — référentiels.
- `POST /api-services/transaction/refund-cancel` `{ apiKey, transactionId }`.
- `POST /api-services/new-claim` — réclamation.
- MoneyGram : `moneygram-reception-info`, `moneygram-send-info`.

## 7. Sécurité (doc §10) — optionnel, activé sur demande InTech
- **HMAC-SHA256** : en-têtes `Hmac-Signature` + `Timestamp` (ms Unix) ;
  formule `HMAC-SHA256(httpMethod:timestamp:jsonBody, hmacSecretKey)`.
- **SSL pinning** : empreinte SHA256 de la clé publique du certificat.

## Points NON DOCUMENTÉS dans les sources
- URL sandbox/test.
- Procédure exacte d'obtention de la clé API.
- Limites de débit générales (hors get-transaction-status).
- Type réel du champ `data` (chaîne §4 vs objet Postman).

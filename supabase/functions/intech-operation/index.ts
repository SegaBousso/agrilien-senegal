// =============================================================================
// AgriLien — Edge Function `intech-operation`
// Initie une opération InTech API V2 (cash-in, crédit, bill, WhatsApp).
//
// Source EXCLUSIVE : https://doc.intech.sn/doc_intech_api.php + collection Postman.
//   - Endpoint    : POST {base}/api-services/operation
//   - Auth POST   : clé API dans le CORPS, champ `apiKey` (doc §2)
//   - Body requis : phone, amount, codeService, externalTransactionId,
//                   callbackUrl, apiKey, data  (doc §4)
//   - Réponse OK  : code === 2000, data.transactionId, data.status = "PENDING"
//                   (certains services renvoient authLinkUrl / deepLinkUrl)
//
// Secrets : INTECH_API_KEY, INTECH_BASE_URL (ex. https://api.intech.sn),
//           SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto).
//
// Déploiement : supabase functions deploy intech-operation --no-verify-jwt
// (on vérifie le JWT nous-mêmes via getUser ; CORS propre pour le navigateur.)
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// SÉCURITÉ : seuls les CASH-IN (l'acheteur paie) sont déclenchables côté client.
// Les CASH-OUT (décaissement vers un tiers) ne doivent JAMAIS être exposés au
// navigateur — ils passent par une fonction serveur dédiée (intech-payout).
const ALLOWED_CLIENT_SERVICES = new Set([
  'WAVE_SN_API_CASH_IN',
  'ORANGE_SN_API_CASH_IN',
  'FREE_SN_WALLET_CASH_IN',
  'WIZALL_SN_API_CASH_IN',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    return await handle(req);
  } catch (e) {
    console.error('intech-operation error:', e);
    return json({ error: 'Erreur interne du service de paiement.' }, 500);
  }
});

async function handle(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('INTECH_API_KEY');
  const baseUrl = Deno.env.get('INTECH_BASE_URL');
  if (!apiKey || !baseUrl) {
    return json({ error: 'Service non configuré (secrets InTech manquants).' }, 503);
  }

  // --- Authentification de l'utilisateur (acheteur) ----------------------
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: 'Session invalide.' }, 401);
  const userId = userData.user.id;

  // --- Entrée client : on ne fait PAS confiance au montant pour un paiement
  //     de commande -> il faut le recalculer (cf. payment-initiate). Ici on
  //     accepte codeService + amount + phone + (extra) pour rester générique.
  let payloadIn: {
    codeService?: string;
    amount?: number;
    phone?: string;
    requestId?: string;
    data?: Record<string, unknown>;
    extra?: Record<string, unknown>;
  };
  try {
    payloadIn = await req.json();
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  const { codeService, amount, phone, requestId, data = {}, extra = {} } = payloadIn;
  if (!codeService || !ALLOWED_CLIENT_SERVICES.has(codeService)) {
    return json({ error: 'Service non autorisé côté client.' }, 403);
  }
  if (!(typeof amount === 'number' && amount > 0)) {
    return json({ error: 'Montant invalide.' }, 422);
  }
  if (!phone) return json({ error: 'Numéro requis.' }, 422);

  // --- Référence unique + enregistrement local (statut PENDING) ----------
  const externalTransactionId = crypto.randomUUID();
  const { error: insErr } = await admin.from('intech_transactions').insert({
    external_transaction_id: externalTransactionId,
    code_service: codeService,
    direction: 'cashin',
    phone,
    amount,
    status: 'PENDING',
    user_id: userId,
    request_id: requestId ?? null,
    data,
  });
  if (insErr) return json({ error: "Création de l'opération impossible." }, 500);

  // --- Appel InTech : POST /api-services/operation -----------------------
  // doc §4 : `data` "doit être une chaîne JSON sérialisée".
  const body = {
    phone,
    amount,
    codeService,
    externalTransactionId,
    callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/intech-callback`,
    apiKey,
    data: JSON.stringify(data),
    ...extra, // ex. sender, successRedirectUrl, errorRedirectUrl, useOMQrCode
  };

  const res = await fetch(`${baseUrl}/api-services/operation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await res.json().catch(() => ({}));

  // doc §6 : succès = code === 2000.
  if (result?.code !== 2000 || result?.error === true) {
    await admin
      .from('intech_transactions')
      .update({ status: 'FAILLED', error_type: result?.data?.errorType ?? result })
      .eq('external_transaction_id', externalTransactionId);
    return json({ error: result?.msg ?? 'Opération refusée par InTech.', detail: result }, 502);
  }

  const d = result.data ?? {};
  await admin
    .from('intech_transactions')
    .update({ intech_transaction_id: String(d.transactionId ?? ''), status: d.status ?? 'PENDING' })
    .eq('external_transaction_id', externalTransactionId);

  // On renvoie au front : la référence (pour suivre le statut) + les liens
  // éventuels (authLinkUrl pour carte, deepLinkUrl pour Wave/OM).
  return json({
    externalTransactionId,
    transactionId: d.transactionId ?? null,
    status: d.status ?? 'PENDING',
    authLinkUrl: d.authLinkUrl ?? null,
    deepLinkUrl: d.deepLinkUrl ?? null,
    notificationMessage: d.notificationMessage ?? null,
  });
}

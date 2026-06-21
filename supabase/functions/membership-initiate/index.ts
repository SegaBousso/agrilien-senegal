// =============================================================================
// AgriLien Sénégal — Edge Function `membership-initiate`
// Initie un paiement PayTech pour l'adhésion « Partenaire » d'un prestataire.
//
// Sécurité : le montant et la durée sont fixés ICI (jamais reçus du client). Le
// client n'envoie rien d'autre que son JWT ; on retrouve sa fiche prestataire,
// on vérifie qu'elle est vérifiée, et on crée une transaction kind='membership'.
// L'IPN (payment-ipn) la marque 'paye' (pas de request_id → pas de réservation
// de stock), puis un trigger active l'adhésion.
//
// === Tarif (source de vérité) — garder synchronisé avec src/lib/constants.ts ===
const MEMBERSHIP_PRICE = 10000; // FCFA
const MEMBERSHIP_DAYS = 30; // jours
// ============================================================================
//
// Secrets requis : PAYTECH_API_KEY, PAYTECH_API_SECRET, PAYTECH_ENV (test|prod),
//   APP_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto).
//
// Déploiement : supabase functions deploy membership-initiate   (JWT vérifié)
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAYTECH_URL = 'https://paytech.sn/api/payment/request-payment';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

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
    console.error('membership-initiate error:', e);
    return json({ error: 'Erreur interne du service de paiement.' }, 500);
  }
});

async function handle(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('PAYTECH_API_KEY');
  const apiSecret = Deno.env.get('PAYTECH_API_SECRET');
  if (!apiKey || !apiSecret) {
    return json({ error: 'Paiement non configuré (secrets PayTech manquants).' }, 503);
  }

  // --- Authentification du prestataire ------------------------------------
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: 'Session invalide.' }, 401);
  const userId = userData.user.id;

  // --- Fiche prestataire (doit être vérifiée) -----------------------------
  const { data: provider, error: provErr } = await admin
    .from('service_providers')
    .select('id, name, verification_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (provErr) return json({ error: 'Lecture de la fiche impossible.' }, 500);
  if (!provider) return json({ error: "Vous n'avez pas encore de fiche prestataire." }, 404);
  if (provider.verification_status !== 'verifie') {
    return json({ error: 'Votre fiche doit être vérifiée avant de devenir Partenaire.' }, 409);
  }

  const amount = MEMBERSHIP_PRICE;
  const env = Deno.env.get('PAYTECH_ENV') ?? 'test';
  const refCommand = `AGRI-MBR-${String(provider.id).slice(0, 8)}-${Date.now()}`;

  const { data: tx, error: txErr } = await admin
    .from('transactions')
    .insert({
      ref_command: refCommand,
      kind: 'membership',
      provider_id: provider.id,
      membership_days: MEMBERSHIP_DAYS,
      buyer_id: userId,
      amount,
      currency: 'XOF',
      provider: 'paytech',
      status: 'initie',
      env,
    })
    .select('id')
    .single();
  if (txErr || !tx) return json({ error: 'Création de la transaction impossible.' }, 500);

  // --- Appel PayTech ------------------------------------------------------
  const appUrl = Deno.env.get('APP_URL') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const payload = {
    item_name: `Adhésion Partenaire — ${provider.name}`,
    item_price: amount,
    currency: 'XOF',
    ref_command: refCommand,
    command_name: `Adhésion Partenaire (${MEMBERSHIP_DAYS} jours) — ${provider.name}`,
    env,
    ipn_url: `${supabaseUrl}/functions/v1/payment-ipn`,
    success_url: `${appUrl}/paiement/succes?ref=${refCommand}`,
    cancel_url: `${appUrl}/paiement/annule?ref=${refCommand}`,
    custom_field: JSON.stringify({ transaction_id: tx.id, provider_id: provider.id, kind: 'membership' }),
  };

  const res = await fetch(PAYTECH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      API_KEY: apiKey,
      API_SECRET: apiSecret,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success !== 1 || !data?.token) {
    await admin.from('transactions').update({ status: 'echoue' }).eq('id', tx.id);
    return json({ error: 'PayTech a refusé la demande.', detail: data }, 502);
  }

  await admin.from('transactions').update({ token: data.token }).eq('id', tx.id);
  return json({ redirect_url: data.redirect_url ?? data.redirectUrl, token: data.token });
}

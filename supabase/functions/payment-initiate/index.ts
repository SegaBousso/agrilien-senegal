// =============================================================================
// AgriLien Sénégal — Edge Function `payment-initiate`
// Initie un paiement PayTech pour une demande d'achat ACCEPTÉE.
//
// Sécurité : le montant n'est JAMAIS reçu du client. Il est recalculé ici à
// partir de la demande d'achat (quantité × prix de l'annonce). Le client envoie
// uniquement { request_id }. La fonction vérifie que la demande appartient bien
// à l'acheteur connecté et qu'elle est au statut 'acceptee'.
//
// Secrets requis : PAYTECH_API_KEY, PAYTECH_API_SECRET, PAYTECH_ENV (test|prod),
//   APP_URL (base du front, ex. https://agrilien.sn),
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto).
//
// Déploiement : supabase functions deploy payment-initiate   (JWT vérifié)
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAYTECH_URL = 'https://paytech.sn/api/payment/request-payment';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
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
    // Toujours répondre avec les en-têtes CORS, sinon le navigateur signale
    // "Failed to send a request to the Edge Function".
    console.error('payment-initiate error:', e);
    return json({ error: 'Erreur interne du service de paiement.' }, 500);
  }
});

async function handle(req: Request): Promise<Response> {
  // Secrets indispensables : on échoue proprement s'ils manquent.
  const apiKey = Deno.env.get('PAYTECH_API_KEY');
  const apiSecret = Deno.env.get('PAYTECH_API_SECRET');
  if (!apiKey || !apiSecret) {
    return json({ error: 'Paiement non configuré (secrets PayTech manquants).' }, 503);
  }

  // --- Authentification de l'acheteur -------------------------------------
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: 'Session invalide.' }, 401);
  const buyerId = userData.user.id;

  // --- Lecture de la demande + calcul serveur du montant ------------------
  let requestId: string | undefined;
  try {
    ({ request_id: requestId } = await req.json());
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }
  if (!requestId) return json({ error: 'request_id manquant.' }, 400);

  const { data: request, error: reqErr } = await admin
    .from('purchase_requests')
    .select('id, buyer_id, status, quantity_requested, listing:listings(title, price, unit)')
    .eq('id', requestId)
    .single();

  if (reqErr || !request) return json({ error: 'Demande introuvable.' }, 404);
  if (request.buyer_id !== buyerId) return json({ error: 'Accès refusé.' }, 403);
  if (request.status !== 'acceptee') {
    return json({ error: 'La demande doit être acceptée avant paiement.' }, 409);
  }

  const listing = request.listing as unknown as { title: string; price: number; unit: string };
  const amount = Math.round(Number(request.quantity_requested) * Number(listing.price));
  if (!(amount > 0)) return json({ error: 'Montant invalide.' }, 422);

  // Empêche un double paiement.
  const { data: existingPaid } = await admin
    .from('transactions')
    .select('id')
    .eq('request_id', requestId)
    .eq('status', 'paye')
    .maybeSingle();
  if (existingPaid) return json({ error: 'Cette commande est déjà payée.' }, 409);

  // --- Création de la transaction (statut initie) -------------------------
  const env = Deno.env.get('PAYTECH_ENV') ?? 'test';
  const refCommand = `AGRI-${requestId.slice(0, 8)}-${Date.now()}`;
  const { data: tx, error: txErr } = await admin
    .from('transactions')
    .insert({
      ref_command: refCommand,
      request_id: requestId,
      buyer_id: buyerId,
      amount,
      currency: 'XOF',
      provider: 'paytech',
      status: 'initie',
      env,
    })
    .select('id')
    .single();
  if (txErr || !tx) return json({ error: "Création de la transaction impossible." }, 500);

  // --- Appel PayTech ------------------------------------------------------
  const appUrl = Deno.env.get('APP_URL') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const payload = {
    item_name: listing.title,
    item_price: amount,
    currency: 'XOF',
    ref_command: refCommand,
    command_name: `Commande AgriLien — ${request.quantity_requested} ${listing.unit} de ${listing.title}`,
    env,
    ipn_url: `${supabaseUrl}/functions/v1/payment-ipn`,
    success_url: `${appUrl}/paiement/succes?ref=${refCommand}`,
    cancel_url: `${appUrl}/paiement/annule?ref=${refCommand}`,
    custom_field: JSON.stringify({ transaction_id: tx.id, request_id: requestId }),
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

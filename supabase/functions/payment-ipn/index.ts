// =============================================================================
// AgriLien Sénégal — Edge Function `payment-ipn`
// Reçoit la notification serveur-à-serveur de PayTech (Instant Payment
// Notification) et met à jour la transaction correspondante.
//
// PayTech envoie les champs en x-www-form-urlencoded (ou JSON selon config).
// Authenticité vérifiée via SHA-256(api_key) == api_key_sha256 et
// SHA-256(api_secret) == api_secret_sha256 (méthode documentée par PayTech).
//
// Déploiement : supabase functions deploy payment-ipn --no-verify-jwt
// (PayTech ne peut pas envoyer de JWT Supabase ; l'auth se fait par les hashes.)
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

/** SHA-256 hexadécimal d'une chaîne. */
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Lit le corps quel que soit le content-type (form-urlencoded ou JSON). */
async function parseBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    return (await req.json().catch(() => ({}))) as Record<string, string>;
  }
  const form = await req.formData().catch(() => null);
  if (!form) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) out[k] = String(v);
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await parseBody(req);
  const {
    type_event,
    ref_command,
    api_key_sha256,
    api_secret_sha256,
    payment_method,
    client_phone,
  } = body;

  if (!ref_command) return new Response('ref_command manquant', { status: 400 });

  // --- Vérification d'authenticité ----------------------------------------
  const expectedKey = await sha256Hex(Deno.env.get('PAYTECH_API_KEY')!);
  const expectedSecret = await sha256Hex(Deno.env.get('PAYTECH_API_SECRET')!);
  if (api_key_sha256 !== expectedKey || api_secret_sha256 !== expectedSecret) {
    return new Response('Signature invalide', { status: 403 });
  }

  // --- Recherche de la transaction ----------------------------------------
  const { data: tx } = await admin
    .from('transactions')
    .select('id, status')
    .eq('ref_command', ref_command)
    .maybeSingle();
  if (!tx) return new Response('Transaction inconnue', { status: 404 });

  // Idempotence : ne retraite pas une transaction déjà finalisée.
  if (tx.status === 'paye') return new Response('Déjà traité', { status: 200 });

  if (type_event === 'sale_complete') {
    await admin
      .from('transactions')
      .update({
        status: 'paye',
        payment_method: payment_method ?? null,
        client_phone: client_phone ?? null,
        paid_at: new Date().toISOString(),
      })
      .eq('id', tx.id); // -> déclenche notify_on_payment (notifs + SMS)
  } else if (type_event === 'sale_canceled') {
    await admin.from('transactions').update({ status: 'annule' }).eq('id', tx.id);
  }

  return new Response('OK', { status: 200 });
});

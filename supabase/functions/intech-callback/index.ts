// =============================================================================
// AgriLien — Edge Function `intech-callback`
// Reçoit le callback (webhook) serveur-à-serveur d'InTech et met à jour
// l'opération correspondante.
//
// Source EXCLUSIVE : https://doc.intech.sn/doc_intech_api.php (§7).
//   - Méthode : POST. Doit répondre HTTP 200 (sinon InTech réessaie après 1 min).
//   - Payload : { msg, status, sha256Hash, transaction:{ transactionId,
//                 externalTransactionId, codeService, amount, ... , data } }
//   - Statut  : "SUCCESS" ou "FAILLED" (deux L, orthographe doc).
//   - Authenticité : sha256Hash == SHA256( transactionId|externalTransactionId|apiKey )
//                    (séparateur = pipe `|` ; apiKey = clé utilisée à l'init).
//
// Déploiement : supabase functions deploy intech-callback --no-verify-jwt
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

/** SHA-256 hexadécimal d'une chaîne (Web Crypto). */
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const apiKey = Deno.env.get('INTECH_API_KEY')!;

  let body: {
    msg?: string;
    status?: string;
    sha256Hash?: string;
    transaction?: {
      transactionId?: string | number;
      externalTransactionId?: string;
      errorType?: unknown;
      data?: unknown;
    };
  };
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const tx = body.transaction;
  const transactionId = String(tx?.transactionId ?? '');
  const externalTransactionId = tx?.externalTransactionId ?? '';
  if (!externalTransactionId) return new Response('externalTransactionId manquant', { status: 400 });

  // --- Vérification d'authenticité (doc §7) ------------------------------
  const expected = await sha256Hex(`${transactionId}|${externalTransactionId}|${apiKey}`);
  if (expected !== body.sha256Hash) {
    // Requête non authentique : on NE met rien à jour. 401 (≠ InTech => les
    // éventuels retries InTech, eux, présenteront le bon hash).
    return new Response('Signature invalide', { status: 401 });
  }

  // --- Mise à jour idempotente -------------------------------------------
  const { data: row } = await admin
    .from('intech_transactions')
    .select('id, status')
    .eq('external_transaction_id', externalTransactionId)
    .maybeSingle();
  if (!row) return new Response('Transaction inconnue', { status: 404 });

  // Statuts terminaux : on ne retraite pas (doc : le callback peut être rejoué).
  if (row.status === 'SUCCESS' || row.status === 'FAILLED') {
    return new Response('Déjà traité', { status: 200 });
  }

  await admin
    .from('intech_transactions')
    .update({
      status: body.status ?? 'PROCESSING', // "SUCCESS" | "FAILLED"
      intech_transaction_id: transactionId || null,
      error_type: tx?.errorType ?? null,
      data: tx?.data ?? null,
    })
    .eq('id', row.id);

  // Doit toujours répondre 200 pour stopper les relances (doc §7).
  return new Response('OK', { status: 200 });
});

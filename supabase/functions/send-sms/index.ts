// =============================================================================
// AgriLien Sénégal — Edge Function `send-sms`
// Envoie les SMS de la file `notification_outbox` via la passerelle Sendtext SN.
//
// Deux modes d'invocation :
//   1. Database Webhook (INSERT sur notification_outbox) -> envoie CETTE ligne.
//   2. Cron de relance (body { "mode": "retry" } + header x-cron-secret)
//      -> balaie les lignes bloquées (pending/failed, < MAX_ATTEMPTS).
//
// Secrets requis (Dashboard > Edge Functions > Secrets) :
//   SENDTEXT_API_KEY, SENDTEXT_API_SECRET, SENDTEXT_SENDER_NAME
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (injectés par défaut)
//   CRON_SECRET (pour autoriser le mode retry)
//
// Déploiement :  supabase functions deploy send-sms --no-verify-jwt
// (le webhook l'appelle sans JWT utilisateur ; on protège via la clé service.)
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SENDTEXT_URL = 'https://api.sendtext.sn/v1/sms';
const MAX_ATTEMPTS = 3;

interface OutboxRow {
  id: string;
  recipient_phone: string;
  body: string;
  attempts: number;
  status: string;
}

/** Normalise un numéro sénégalais au format Sendtext : 221 + 9 chiffres, sans `+`. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('221') && digits.length === 12) return digits;
  if (digits.length === 9) return `221${digits}`; // numéro local (77xxxxxxx)
  if (digits.startsWith('00221')) return digits.slice(2);
  return null; // format non reconnu
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

/** Appelle Sendtext pour un message unique. Renvoie { ok, ref?, error? }. */
async function sendOne(phone: string, text: string): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: `Numéro invalide: ${phone}` };

  try {
    const res = await fetch(SENDTEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'SNT-API-KEY': Deno.env.get('SENDTEXT_API_KEY')!,
        'SNT-API-SECRET': Deno.env.get('SENDTEXT_API_SECRET')!,
      },
      body: JSON.stringify({
        sender_name: Deno.env.get('SENDTEXT_SENDER_NAME') ?? 'AgriLien',
        sms_type: 'normal',
        phone: normalized,
        text,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: `Sendtext ${res.status}: ${JSON.stringify(payload)}` };
    }
    return { ok: true, ref: payload?.id ?? payload?.data?.id ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Traite une ligne d'outbox : envoie puis met à jour son statut. */
async function processRow(row: OutboxRow): Promise<void> {
  const result = await sendOne(row.recipient_phone, row.body);
  const attempts = (row.attempts ?? 0) + 1;

  await admin
    .from('notification_outbox')
    .update({
      status: result.ok ? 'sent' : attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
      attempts,
      provider_ref: result.ref ?? null,
      last_error: result.ok ? null : result.error ?? 'erreur inconnue',
      sent_at: result.ok ? new Date().toISOString() : null,
    })
    .eq('id', row.id);
}

Deno.serve(async (req) => {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // pas de corps : ignoré
  }

  // --- Mode relance (cron) ------------------------------------------------
  if (body?.mode === 'retry') {
    if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
      return new Response('Forbidden', { status: 403 });
    }
    const { data: rows } = await admin
      .from('notification_outbox')
      .select('id, recipient_phone, body, attempts, status')
      .in('status', ['pending', 'failed'])
      .lt('attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(50);

    for (const row of (rows ?? []) as OutboxRow[]) {
      await processRow(row);
    }
    return Response.json({ processed: rows?.length ?? 0 });
  }

  // --- Mode webhook (INSERT sur notification_outbox) ----------------------
  // Supabase envoie { type, table, record, old_record, schema }.
  const record = (body?.record ?? null) as OutboxRow | null;
  if (!record?.id) {
    return new Response('Aucune ligne à traiter', { status: 400 });
  }
  await processRow(record);
  return Response.json({ ok: true });
});

// =============================================================================
// AgriLien — Edge Function `admin-users`
// Actions sensibles sur les comptes, réservées aux admins et JOURNALISÉES.
//   - suspend        : bannit le compte (ban_duration) -> connexion bloquée
//   - reactivate     : lève le ban
//   - reset_password : envoie un email de réinitialisation (l'admin ne définit
//                      JAMAIS le mot de passe lui-même)
//
// Sécurité : la clé service_role reste serveur. On vérifie que l'appelant est
// authentifié ET admin avant toute action. Auto-action interdite.
//
// Déploiement : supabase functions deploy admin-users --no-verify-jwt
// Secrets : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto), APP_URL.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

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

const PERMANENT_BAN = '876000h'; // ~100 ans

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    return await handle(req);
  } catch (e) {
    console.error('admin-users error:', e);
    return json({ error: 'Erreur interne.' }, 500);
  }
});

async function handle(req: Request): Promise<Response> {
  // --- Authentification + contrôle admin ---------------------------------
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);
  const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !caller.user) return json({ error: 'Session invalide.' }, 401);
  const callerId = caller.user.id;

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single();
  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Accès réservé aux administrateurs.' }, 403);
  }

  // --- Entrée -------------------------------------------------------------
  let action: string | undefined;
  let userId: string | undefined;
  try {
    ({ action, userId } = await req.json());
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }
  if (!action || !userId) return json({ error: 'Paramètres manquants.' }, 400);
  if (userId === callerId) return json({ error: 'Action interdite sur votre propre compte.' }, 403);

  let details: Record<string, unknown> = {};

  switch (action) {
    case 'suspend': {
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: PERMANENT_BAN });
      if (error) return json({ error: error.message }, 502);
      await admin.from('profiles').update({ suspended: true }).eq('id', userId);
      break;
    }
    case 'reactivate': {
      const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      if (error) return json({ error: error.message }, 502);
      await admin.from('profiles').update({ suspended: false }).eq('id', userId);
      break;
    }
    case 'reset_password': {
      const { data: target } = await admin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      if (!target?.email) return json({ error: 'Email introuvable.' }, 404);
      const redirectTo = `${Deno.env.get('APP_URL') ?? ''}/reinitialiser`;
      const { error } = await admin.auth.resetPasswordForEmail(target.email, { redirectTo });
      if (error) return json({ error: error.message }, 502);
      details = { email: target.email };
      break;
    }
    default:
      return json({ error: 'Action inconnue.' }, 400);
  }

  // --- Journalisation (audit) --------------------------------------------
  await admin.from('admin_actions').insert({
    admin_id: callerId,
    target_user: userId,
    action,
    details,
  });

  return json({ ok: true });
}

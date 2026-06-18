import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

/**
 * Définition d'un nouveau mot de passe après le lien de réinitialisation reçu
 * par email (déclenché par l'admin ou par « mot de passe oublié »). Supabase
 * ouvre une session de récupération via detectSessionInUrl ; on appelle ensuite
 * updateUser({ password }).
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Une session de récupération doit être présente (sinon lien invalide/expiré).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast('Mot de passe : au moins 8 caractères.', 'error');
    if (password !== confirm) return toast('Les mots de passe ne correspondent pas.', 'error');
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast('Mot de passe mis à jour. Vous pouvez vous connecter.', 'success');
      navigate('/connexion');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Échec de la mise à jour.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Réinitialiser le mot de passe" />
      <div className="container max-w-md py-12">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-2 text-primary-700">
              <KeyRound className="h-5 w-5" />
              <h1 className="font-display text-lg font-bold">Nouveau mot de passe</h1>
            </div>

            {!ready ? (
              <p className="rounded-lg bg-accent-100 px-3 py-2 text-sm text-accent-800">
                Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <Field label="Nouveau mot de passe" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field label="Confirmer le mot de passe" htmlFor="confirm">
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Mettre à jour
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

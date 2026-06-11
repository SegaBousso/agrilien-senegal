import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Seo } from '@/components/Seo';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, type LoginInput } from '@/lib/validations';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await signIn(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      // Petite latence pour laisser le profil se charger, puis redirection.
      setTimeout(() => navigate(from ?? '/', { replace: true }), 100);
    } catch (err) {
      setServerError(
        err instanceof Error && err.message.includes('Invalid')
          ? 'Email ou mot de passe incorrect.'
          : 'Connexion impossible. Veuillez réessayer.',
      );
    }
  });

  return (
    <>
      <Seo title="Connexion" description="Connectez-vous à votre compte AgriLien Sénégal." />
      <div className="container flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-surface p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Bon retour 👋</h1>
            <p className="mt-1 text-sm text-gray-600">Connectez-vous pour accéder à votre espace.</p>

            {serverError && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Email" htmlFor="email" error={errors.email?.message} required>
                <Input id="email" type="email" autoComplete="email" {...register('email')} />
              </Field>
              <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} required>
                <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              </Field>
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Se connecter
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="font-semibold text-primary-700 hover:underline">
                Inscrivez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, type LoginInput } from '@/lib/validations';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      <AuthLayout>
        <h1 className="font-display text-2xl font-bold text-gray-900">Bon retour 👋</h1>
        <p className="mt-1 text-sm text-gray-600">Connectez-vous pour accéder à votre espace.</p>

        {serverError && (
          <div
            className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              {...register('email')}
            />
          </Field>

          <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} required>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-11"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>

          <div className="flex justify-end">
            <Link to="/contact" className="text-sm font-medium text-primary-700 hover:underline">
              Mot de passe oublié&nbsp;?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Se connecter <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-primary-700 hover:underline">
            Inscrivez-vous
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}

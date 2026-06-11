import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Sprout, Store } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { BUYER_TYPE_LABELS, SENEGAL_REGIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer', buyer_type: 'particulier' },
  });

  const role = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      const { needsConfirmation } = await signUp(values);
      if (needsConfirmation) {
        // Email à confirmer : pas de session, on dirige vers la connexion.
        toast('Compte créé ! Vérifiez votre email pour confirmer votre inscription.', 'success');
        setTimeout(() => navigate('/connexion', { replace: true }), 400);
        return;
      }
      toast('Compte créé avec succès ! Bienvenue sur AgriLien.', 'success');
      setTimeout(
        () => navigate(values.role === 'producer' ? '/producteur/dashboard' : '/acheteur/dashboard', { replace: true }),
        200,
      );
    } catch (err) {
      setServerError(
        err instanceof Error && err.message.toLowerCase().includes('already')
          ? 'Un compte existe déjà avec cet email.'
          : "Inscription impossible. Veuillez réessayer.",
      );
    }
  });

  return (
    <>
      <Seo title="Inscription" description="Créez votre compte producteur ou acheteur sur AgriLien Sénégal." />
      <AuthLayout wide>
        <h1 className="font-display text-2xl font-bold text-gray-900">Créer un compte</h1>
        <p className="mt-1 text-sm text-gray-600">Rejoignez la communauté agricole sénégalaise.</p>

        {serverError && (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {/* Choix du rôle */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Je suis un… <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === 'producer'}
                onClick={() => setValue('role', 'producer')}
                icon={Sprout}
                title="Producteur"
                subtitle="Je vends mes récoltes"
              />
              <RoleCard
                active={role === 'buyer'}
                onClick={() => setValue('role', 'buyer')}
                icon={Store}
                title="Acheteur"
                subtitle="Je cherche des produits"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" htmlFor="full_name" error={errors.full_name?.message} required>
              <Input id="full_name" autoComplete="name" {...register('full_name')} />
            </Field>
            <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message} hint="Ex. 77 123 45 67">
              <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
            </Field>
          </div>

          <Field label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" autoComplete="email" placeholder="vous@exemple.com" {...register('email')} />
          </Field>

          {/* Champs spécifiques au rôle */}
          {role === 'producer' ? (
            <div className="grid gap-4 rounded-xl border border-border bg-muted p-4 sm:grid-cols-2">
              <Field label="Nom de l'exploitation" htmlFor="farm_name" error={errors.farm_name?.message} required>
                <Input id="farm_name" placeholder="Ferme Keur Massar" {...register('farm_name')} />
              </Field>
              <Field label="Région" htmlFor="region" error={errors.region?.message} required>
                <Select id="region" defaultValue="" {...register('region')}>
                  <option value="" disabled>
                    Sélectionner
                  </option>
                  {SENEGAL_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 rounded-xl border border-border bg-muted p-4 sm:grid-cols-2">
              <Field label="Type d'acheteur" htmlFor="buyer_type" error={errors.buyer_type?.message}>
                <Select id="buyer_type" {...register('buyer_type')}>
                  {Object.entries(BUYER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Organisation (optionnel)" htmlFor="organization_name">
                <Input id="organization_name" {...register('organization_name')} />
              </Field>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères min." required>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pr-11"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmer" htmlFor="confirm_password" error={errors.confirm_password?.message} required>
              <Input
                id="confirm_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirm_password')}
              />
            </Field>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Créer mon compte <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="font-semibold text-primary-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </AuthLayout>
    </>
  );
}

function RoleCard({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Sprout;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-200',
        active
          ? 'border-primary-600 bg-primary-600/10'
          : 'border-border hover:border-primary-300 hover:bg-muted',
      )}
    >
      {active && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary-600" />}
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
          active ? 'bg-primary-600 text-white' : 'bg-muted text-gray-400',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-2.5 font-semibold text-gray-900">{title}</span>
      <span className="text-xs text-gray-500">{subtitle}</span>
    </button>
  );
}

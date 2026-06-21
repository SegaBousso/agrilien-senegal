import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Clock, Save, ShieldCheck, ShieldX } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  useCreateProvider,
  useMyProvider,
  useRequestProviderVerification,
  useUpdateProvider,
} from '@/hooks/useProviders';
import {
  SENEGAL_REGIONS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { serviceProviderSchema, type ServiceProviderInput } from '@/lib/validations';

const ED = '"Bricolage Grotesque", Lexend, system-ui, sans-serif';
const BISSAP = '#8A1C3B';

type RegionName = (typeof SENEGAL_REGIONS)[number];

const EMPTY: ServiceProviderInput = {
  name: '',
  category: 'transport',
  region: 'Dakar',
  commune: '',
  service_areas: [],
  phone: '',
  whatsapp: '',
  description: '',
};

export default function ServiceProviderFormPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: mine, isLoading } = useMyProvider(profile?.id);

  const create = useCreateProvider(profile?.id);
  const update = useUpdateProvider(profile?.id);
  const requestVerif = useRequestProviderVerification(profile?.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceProviderInput>({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: EMPTY,
  });

  // Pré-remplit quand l'entrée existante est chargée.
  useEffect(() => {
    if (mine) {
      reset({
        name: mine.name,
        category: mine.category,
        region: mine.region as ServiceProviderInput['region'],
        commune: mine.commune ?? '',
        service_areas: mine.service_areas as ServiceProviderInput['service_areas'],
        phone: mine.phone,
        whatsapp: mine.whatsapp ?? '',
        description: mine.description ?? '',
      });
    }
  }, [mine, reset]);

  const areas = watch('service_areas') ?? [];
  const toggleArea = (r: RegionName) => {
    setValue(
      'service_areas',
      areas.includes(r) ? areas.filter((a) => a !== r) : [...areas, r],
      { shouldDirty: true },
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mine) {
        await update.mutateAsync({ id: mine.id, input: values });
        toast('Fiche mise à jour.', 'success');
      } else {
        await create.mutateAsync(values);
        toast('Fiche créée. Demandez la vérification pour apparaître au carnet.', 'success');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Enregistrement impossible.', 'error');
    }
  });

  const askVerification = async () => {
    if (!mine) return;
    try {
      await requestVerif.mutateAsync(mine.id);
      toast('Demande envoyée. Notre équipe vérifie votre service.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-16">
        <Spinner />
      </div>
    );
  }

  const status = mine?.verification_status;

  return (
    <div className="container max-w-2xl py-10">
      <Seo title="Inscrire mon service" />

      <Link to="/services" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Retour au carnet
      </Link>

      <h1 className="mt-4 text-3xl text-gray-900" style={{ fontFamily: ED, fontWeight: 700, letterSpacing: '-0.01em' }}>
        {mine ? 'Mon service au carnet' : 'Inscrire mon service'}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Transport ou mécanisation : décrivez votre service. Après vérification par AgriLien, votre fiche
        devient visible et les clients vous appellent directement.
      </p>

      {/* Bandeau de statut */}
      {mine && (
        <div className="mt-6">
          {status === 'verifie' && (
            <StatusBanner
              tone="ok"
              icon={<BadgeCheck className="h-5 w-5" />}
              title="Vérifié — visible au carnet"
              text="Votre fiche est publiée. Toute modification importante peut nécessiter une nouvelle vérification."
            />
          )}
          {status === 'en_attente' && (
            <StatusBanner
              tone="wait"
              icon={<Clock className="h-5 w-5" />}
              title="En attente de vérification"
              text="Notre équipe contrôle votre service. Vous serez notifié dès la décision."
            />
          )}
          {(status === 'non_verifie' || status === 'rejete') && (
            <StatusBanner
              tone={status === 'rejete' ? 'no' : 'wait'}
              icon={status === 'rejete' ? <ShieldX className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              title={status === 'rejete' ? 'Vérification refusée' : 'Pas encore vérifié'}
              text={
                status === 'rejete'
                  ? mine.verification_notes
                    ? `Motif : ${mine.verification_notes} — corrigez puis redemandez la vérification.`
                    : 'Corrigez votre fiche puis redemandez la vérification.'
                  : 'Votre fiche est enregistrée mais pas encore visible. Demandez la vérification.'
              }
              action={
                <Button size="sm" onClick={askVerification} loading={requestVerif.isPending}>
                  <ShieldCheck className="h-4 w-4" /> Demander la vérification
                </Button>
              }
            />
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <Field label="Nom du service" htmlFor="name" error={errors.name?.message} required hint="Ex. « Transport Diallo & Fils », « Tracteurs du Saloum »">
          <Input id="name" {...register('name')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de service" htmlFor="category" error={errors.category?.message} required>
            <Select id="category" {...register('category')}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {SERVICE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Région de base" htmlFor="region" error={errors.region?.message} required>
            <Select id="region" {...register('region')}>
              {SENEGAL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Commune / localité" htmlFor="commune" error={errors.commune?.message} hint="Facultatif">
          <Input id="commune" {...register('commune')} />
        </Field>

        <Field
          label="Zones desservies"
          error={Array.isArray(errors.service_areas) ? undefined : errors.service_areas?.message}
          hint="Régions où vous intervenez (en plus de votre région de base)"
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {SENEGAL_REGIONS.map((r) => {
              const on = areas.includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleArea(r)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    on ? 'text-white' : 'border-border bg-surface text-gray-600 hover:bg-muted',
                  )}
                  style={on ? { backgroundColor: BISSAP, borderColor: BISSAP } : undefined}
                  aria-pressed={on}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message} required hint="Numéro d'appel direct">
            <Input id="phone" inputMode="tel" placeholder="77 123 45 67" {...register('phone')} />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" error={errors.whatsapp?.message} hint="Facultatif">
            <Input id="whatsapp" inputMode="tel" placeholder="77 123 45 67" {...register('whatsapp')} />
          </Field>
        </div>

        <Field label="Description" htmlFor="description" error={errors.description?.message} hint="Matériel, capacité, tarifs indicatifs, disponibilités…">
          <Textarea id="description" rows={4} {...register('description')} />
        </Field>

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={isSubmitting || create.isPending || update.isPending}>
            <Save className="h-4 w-4" /> {mine ? 'Enregistrer' : 'Créer ma fiche'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function StatusBanner({
  tone,
  icon,
  title,
  text,
  action,
}: {
  tone: 'ok' | 'wait' | 'no';
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  const styles = {
    ok: 'border-primary-200 bg-primary-50 text-primary-800',
    wait: 'border-accent-200 bg-accent-50 text-accent-600',
    no: 'border-red-200 bg-red-50 text-red-700',
  }[tone];
  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between', styles)}>
      <div className="flex gap-3">
        <span className="shrink-0">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-sm opacity-90">{text}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

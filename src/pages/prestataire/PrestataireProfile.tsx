import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Clock, Save, ShieldCheck, ShieldX } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  useCreateProvider,
  useMyProvider,
  useRequestProviderVerification,
  useUpdateProvider,
} from '@/hooks/useProviders';
import { useActiveServices } from '@/hooks/useServices';
import { SENEGAL_REGIONS, SERVICE_DOMAINS, SERVICE_DOMAIN_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { serviceProviderSchema, type ServiceProviderInput } from '@/lib/validations';

const BISSAP = '#8A1C3B';

type RegionName = (typeof SENEGAL_REGIONS)[number];

const EMPTY: ServiceProviderInput = {
  name: '',
  service_ids: [],
  region: 'Dakar',
  commune: '',
  service_areas: [],
  phone: '',
  whatsapp: '',
  description: '',
};

export default function PrestataireProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: mine, isLoading } = useMyProvider(profile?.id);
  const { data: catalog = [] } = useActiveServices();

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

  useEffect(() => {
    if (mine) {
      reset({
        name: mine.name,
        service_ids: (mine.services ?? []).map((s) => s.id),
        region: mine.region as RegionName,
        commune: mine.commune ?? '',
        service_areas: mine.service_areas as RegionName[],
        phone: mine.phone,
        whatsapp: mine.whatsapp ?? '',
        description: mine.description ?? '',
      });
    }
  }, [mine, reset]);

  const areas = watch('service_areas') ?? [];
  const toggleArea = (r: RegionName) => {
    setValue('service_areas', areas.includes(r) ? areas.filter((a) => a !== r) : [...areas, r], {
      shouldDirty: true,
    });
  };

  const serviceIds = watch('service_ids') ?? [];
  const toggleService = (id: string) => {
    setValue('service_ids', serviceIds.includes(id) ? serviceIds.filter((s) => s !== id) : [...serviceIds, id], {
      shouldDirty: true,
    });
  };

  const grouped = SERVICE_DOMAINS.map((d) => ({
    domain: d,
    items: catalog.filter((s) => s.domain === d),
  })).filter((g) => g.items.length > 0);

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

  if (isLoading) return <Spinner />;

  const status = mine?.verification_status;

  return (
    <>
      <Seo title="Ma fiche prestataire" />
      <PageHeader
        title="Ma fiche prestataire"
        description="Décrivez votre service et cochez ce que vous proposez. Après vérification, votre fiche apparaît au Carnet."
      />

      {mine && (
        <div className="mb-6">
          {status === 'verifie' && (
            <StatusBanner
              tone="ok"
              icon={<BadgeCheck className="h-5 w-5" />}
              title="Vérifié — visible au carnet"
              text="Votre fiche est publiée. Les clients vous appellent directement."
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

      <form
        onSubmit={onSubmit}
        className="max-w-2xl space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-soft"
      >
        <Field
          label="Nom de votre service"
          htmlFor="name"
          error={errors.name?.message}
          required
          hint="Ex. « Transport Diallo & Fils », « Tracteurs du Saloum »"
        >
          <Input id="name" {...register('name')} />
        </Field>

        {/* Services proposés (catalogue) */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Services que je propose</p>
          {grouped.length === 0 ? (
            <p className="text-sm text-gray-500">Le catalogue est vide pour l'instant. Revenez bientôt.</p>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              {grouped.map((g) => (
                <div key={g.domain}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {SERVICE_DOMAIN_LABELS[g.domain]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((s) => {
                      const on = serviceIds.includes(s.id);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            on ? 'text-white' : 'border-border bg-surface text-gray-700 hover:bg-muted',
                          )}
                          style={on ? { backgroundColor: BISSAP, borderColor: BISSAP } : undefined}
                          aria-pressed={on}
                          title={s.description ?? undefined}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="Région de base" htmlFor="region" error={errors.region?.message} required>
          <Select id="region" {...register('region')}>
            {SENEGAL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Commune / localité" htmlFor="commune" error={errors.commune?.message} hint="Facultatif">
          <Input id="commune" {...register('commune')} />
        </Field>

        <Field label="Zones desservies" hint="Régions où vous intervenez (en plus de votre région de base)">
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

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          hint="Matériel, capacité, tarifs indicatifs, disponibilités…"
        >
          <Textarea id="description" rows={4} {...register('description')} />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || create.isPending || update.isPending}>
            <Save className="h-4 w-4" /> {mine ? 'Enregistrer' : 'Créer ma fiche'}
          </Button>
        </div>
      </form>
    </>
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
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between',
        styles,
      )}
    >
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

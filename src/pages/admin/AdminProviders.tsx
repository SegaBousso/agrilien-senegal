import { useState } from 'react';
import { BadgeCheck, Check, MapPin, Phone, Star, StarOff, Tractor, Truck, X } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Spinner, EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  useAdminProviders,
  useSetProviderMembership,
  useSetProviderVerification,
} from '@/hooks/useProviders';
import { useToast } from '@/context/ToastContext';
import { SERVICE_CATEGORY_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { ServiceCategory, VerificationStatus } from '@/types/database';

const TABS: { value: VerificationStatus; label: string }[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'verifie', label: 'Vérifiés' },
  { value: 'rejete', label: 'Refusés' },
];

const GLYPH: Record<ServiceCategory, typeof Truck> = {
  transport: Truck,
  mecanisation: Tractor,
};

export default function AdminProviders() {
  const [tab, setTab] = useState<VerificationStatus>('en_attente');
  const [reject, setReject] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState('');

  const { data: rows = [], isLoading } = useAdminProviders(tab);
  const decide = useSetProviderVerification();
  const membership = useSetProviderMembership();
  const { toast } = useToast();

  const verify = async (id: string) => {
    try {
      await decide.mutateAsync({ id, verified: true });
      toast('Prestataire vérifié.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    }
  };

  const confirmReject = async () => {
    if (!reject) return;
    try {
      await decide.mutateAsync({ id: reject.id, verified: false, notes: notes.trim() || undefined });
      toast('Demande refusée.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    } finally {
      setReject(null);
      setNotes('');
    }
  };

  const toggleMembership = async (id: string, active: boolean) => {
    try {
      await membership.mutateAsync({ id, active });
      toast(active ? 'Adhésion « Partenaire » activée.' : 'Adhésion désactivée.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    }
  };

  return (
    <>
      <Seo title="Carnet des prestataires" />
      <PageHeader
        title="Carnet des prestataires"
        description="Vérifiez les services (transport, mécanisation) et gérez les adhésions « Partenaire »."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-primary-600 text-white' : 'bg-muted text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Aucun prestataire"
          description={
            tab === 'en_attente'
              ? 'Aucune demande en attente.'
              : 'Aucun prestataire dans cette catégorie.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => {
            const Icon = GLYPH[p.category];
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                        {p.name}
                        {p.verification_status === 'verifie' && (
                          <BadgeCheck className="h-4 w-4 text-primary-600" />
                        )}
                        {p.membership_active && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-600">
                            Partenaire
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{SERVICE_CATEGORY_LABELS[p.category]}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {p.region}
                          {p.commune ? ` · ${p.commune}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {p.phone}
                        </span>
                        <span>Inscrit le {formatDate(p.created_at)}</span>
                      </div>
                      {p.service_areas.length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">Dessert : {p.service_areas.join(', ')}</p>
                      )}
                      {p.description && <p className="mt-2 max-w-2xl text-sm text-gray-600">{p.description}</p>}
                      {p.verification_status === 'rejete' && p.verification_notes && (
                        <p className="mt-1 text-sm text-red-600">Motif : {p.verification_notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {tab === 'en_attente' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => verify(p.id)} loading={decide.isPending}>
                          <Check className="h-4 w-4" /> Vérifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setReject({ id: p.id, name: p.name })}
                        >
                          <X className="h-4 w-4" /> Refuser
                        </Button>
                      </div>
                    )}
                    {tab === 'rejete' && (
                      <Button size="sm" onClick={() => verify(p.id)} loading={decide.isPending}>
                        <Check className="h-4 w-4" /> Vérifier
                      </Button>
                    )}
                    {tab === 'verifie' && (
                      <>
                        <Button
                          size="sm"
                          variant={p.membership_active ? 'ghost' : 'primary'}
                          onClick={() => toggleMembership(p.id, !p.membership_active)}
                          loading={membership.isPending}
                        >
                          {p.membership_active ? (
                            <>
                              <StarOff className="h-4 w-4" /> Retirer Partenaire
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4" /> Activer Partenaire
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setReject({ id: p.id, name: p.name })}
                        >
                          <X className="h-4 w-4" /> Révoquer
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!reject}
        onClose={() => {
          setReject(null);
          setNotes('');
        }}
        title="Refuser ce prestataire ?"
      >
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{reject?.name}</span> sera informé du refus.
          Indiquez éventuellement un motif (visible par le prestataire).
        </p>
        <div className="mt-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Motif du refus (facultatif)…"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setReject(null);
              setNotes('');
            }}
          >
            Annuler
          </Button>
          <Button variant="danger" loading={decide.isPending} onClick={confirmReject}>
            Confirmer le refus
          </Button>
        </div>
      </Modal>
    </>
  );
}

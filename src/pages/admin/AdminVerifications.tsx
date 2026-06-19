import { useState } from 'react';
import { BadgeCheck, Check, Mail, MapPin, Phone, ShieldX, X } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Spinner, EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useVerifications, useSetProducerVerification } from '@/hooks/useAdmin';
import { useToast } from '@/context/ToastContext';
import { formatDate, initials } from '@/lib/utils';
import type { VerificationStatus } from '@/types/database';

const TABS: { value: VerificationStatus; label: string }[] = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'verifie', label: 'Vérifiés' },
  { value: 'rejete', label: 'Refusés' },
];

export default function AdminVerifications() {
  const [tab, setTab] = useState<VerificationStatus>('en_attente');
  const [reject, setReject] = useState<{ userId: string; name: string } | null>(null);
  const [notes, setNotes] = useState('');

  const { data: rows = [], isLoading } = useVerifications(tab);
  const decide = useSetProducerVerification();
  const { toast } = useToast();

  const verify = async (userId: string) => {
    try {
      await decide.mutateAsync({ userId, verified: true });
      toast('Producteur vérifié.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    }
  };

  const confirmReject = async () => {
    if (!reject) return;
    try {
      await decide.mutateAsync({ userId: reject.userId, verified: false, notes: notes.trim() || undefined });
      toast('Demande refusée.', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    } finally {
      setReject(null);
      setNotes('');
    }
  };

  return (
    <>
      <Seo title="Vérification des producteurs" />
      <PageHeader
        title="Vérification des producteurs"
        description="Accordez le badge « Producteur vérifié » après contrôle des informations."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'bg-primary-600 text-white'
                : 'bg-muted text-gray-600 hover:bg-gray-200'
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
          title="Aucun producteur"
          description={
            tab === 'en_attente'
              ? 'Aucune demande de vérification en attente.'
              : 'Aucun producteur dans cette catégorie.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.user_id}
              className="rounded-2xl border border-border bg-surface p-4 shadow-soft"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-primary-700">
                    {initials(r.farm_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                      {r.farm_name}
                      {r.verification_status === 'verifie' && (
                        <BadgeCheck className="h-4 w-4 text-primary-600" />
                      )}
                    </p>
                    {r.profile?.full_name && (
                      <p className="text-sm text-gray-500">{r.profile.full_name}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {r.region}
                        {r.commune ? ` · ${r.commune}` : ''}
                      </span>
                      {r.profile?.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" /> {r.profile.email}
                        </span>
                      )}
                      {r.profile?.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {r.profile.phone}
                        </span>
                      )}
                      <span>Inscrit le {formatDate(r.created_at)}</span>
                    </div>
                    {r.description && (
                      <p className="mt-2 max-w-2xl text-sm text-gray-600">{r.description}</p>
                    )}
                    {r.verification_status === 'rejete' && r.verification_notes && (
                      <p className="mt-1 text-sm text-red-600">Motif : {r.verification_notes}</p>
                    )}
                  </div>
                </div>

                {tab !== 'verifie' && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => verify(r.user_id)} loading={decide.isPending}>
                      <Check className="h-4 w-4" /> Vérifier
                    </Button>
                    {tab === 'en_attente' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setReject({ userId: r.user_id, name: r.farm_name })}
                      >
                        <X className="h-4 w-4" /> Refuser
                      </Button>
                    )}
                  </div>
                )}
                {tab === 'verifie' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-red-600 hover:bg-red-50"
                    onClick={() => setReject({ userId: r.user_id, name: r.farm_name })}
                  >
                    <ShieldX className="h-4 w-4" /> Révoquer
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!reject}
        onClose={() => {
          setReject(null);
          setNotes('');
        }}
        title="Refuser la vérification ?"
      >
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{reject?.name}</span> sera informé du refus.
          Indiquez éventuellement un motif (visible par le producteur).
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

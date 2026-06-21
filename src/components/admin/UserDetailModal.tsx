import { Ban, KeyRound, Mail, MapPin, Phone, RotateCcw, Sprout } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, Spinner } from '@/components/ui/States';
import { useUserDetail } from '@/hooks/useAdmin';
import { formatDate, formatPrice, formatRelative, initials } from '@/lib/utils';
import type { AdminUserAction } from '@/services/admin.service';
import type { BuyerType, Profile, UserRole } from '@/types/database';

const ROLE_LABELS: Record<UserRole, string> = {
  visitor: 'Visiteur',
  producer: 'Producteur',
  buyer: 'Acheteur',
  prestataire: 'Prestataire',
  admin: 'Administrateur',
};

const ROLE_STYLES: Record<UserRole, string> = {
  visitor: 'bg-gray-100 text-gray-600',
  producer: 'bg-primary-100 text-primary-700',
  buyer: 'bg-blue-100 text-blue-700',
  prestataire: 'bg-[#8A1C3B]/10 text-[#8A1C3B]',
  admin: 'bg-accent-100 text-accent-600',
};

const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  particulier: 'Particulier',
  commercant: 'Commerçant',
  restaurant: 'Restaurant',
  entreprise: 'Entreprise',
  cooperative: 'Coopérative',
  institution: 'Institution',
};

const ACTION_LABELS: Record<string, string> = {
  suspend: 'Compte suspendu',
  reactivate: 'Compte réactivé',
  reset_password: 'Email de réinitialisation envoyé',
  role_change: 'Rôle modifié',
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
      <p className="font-display text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

interface Props {
  /** Utilisateur de la ligne cliquée (null = modal fermé). Fournit l'identité immédiate. */
  user: Profile | null;
  onClose: () => void;
  /** Déclenche le flux de confirmation d'action dans le parent. */
  onAction: (action: AdminUserAction) => void;
}

export function UserDetailModal({ user, onClose, onAction }: Props) {
  const { data, isLoading, isError } = useUserDetail(user?.id ?? null);

  return (
    <Modal open={!!user} onClose={onClose} title="Fiche utilisateur" className="max-w-xl">
      {!user ? null : isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <ErrorState description="Impossible de charger la fiche de cet utilisateur." />
      ) : (
        <div className="space-y-5">
          {/* En-tête identité */}
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-bold text-primary-700">
              {initials(data.profile.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-lg font-bold text-gray-900">
                {data.profile.full_name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge className={ROLE_STYLES[data.profile.role]}>
                  {ROLE_LABELS[data.profile.role]}
                </Badge>
                {data.profile.suspended && (
                  <Badge className="bg-red-100 text-red-700">Suspendu</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" /> {data.profile.email}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" /> {data.profile.phone ?? '—'}
            </p>
            <p className="text-xs text-gray-400">Inscrit le {formatDate(data.profile.created_at)}</p>
          </div>

          {/* Profil de rôle */}
          {data.producer && (
            <div className="rounded-xl border border-border p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-gray-900">
                <Sprout className="h-4 w-4 text-primary-600" /> {data.producer.farm_name}
              </p>
              <p className="mt-1 flex items-center gap-2 text-gray-500">
                <MapPin className="h-4 w-4 text-gray-400" />
                {data.producer.region}
                {data.producer.commune ? ` · ${data.producer.commune}` : ''}
              </p>
            </div>
          )}
          {data.buyer && (
            <div className="rounded-xl border border-border p-3 text-sm">
              <p className="font-medium text-gray-900">
                {BUYER_TYPE_LABELS[data.buyer.buyer_type]}
                {data.buyer.organization_name ? ` — ${data.buyer.organization_name}` : ''}
              </p>
              {data.buyer.region && (
                <p className="mt-1 flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4 text-gray-400" /> {data.buyer.region}
                </p>
              )}
            </div>
          )}

          {/* Activité */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Activité</p>
            <div className="grid grid-cols-3 gap-2">
              {data.profile.role === 'producer' ? (
                <>
                  <Stat label="Annonces" value={data.activity.listings_count} />
                  <Stat label="Demandes reçues" value={data.activity.requests_received} />
                  <Stat label="Acomptes reçus" value={data.activity.deposits_paid_count} />
                </>
              ) : (
                <>
                  <Stat label="Demandes envoyées" value={data.activity.requests_sent} />
                  <Stat label="Acomptes payés" value={data.activity.deposits_paid_count} />
                  <Stat label="Favoris" value={data.activity.favorites_count} />
                </>
              )}
            </div>
            {data.activity.deposits_paid_count > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Total acomptes : {formatPrice(data.activity.deposits_paid_amount)}
              </p>
            )}
          </div>

          {/* Historique des actions admin */}
          {data.recent_actions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Historique admin
              </p>
              <ul className="space-y-1.5 text-sm">
                {data.recent_actions.map((a, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-gray-600">
                    <span>
                      {ACTION_LABELS[a.action] ?? a.action}
                      {a.admin_name ? ` · ${a.admin_name}` : ''}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatRelative(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            {data.profile.suspended ? (
              <Button variant="ghost" size="sm" onClick={() => onAction('reactivate')}>
                <RotateCcw className="h-4 w-4" /> Réactiver
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => onAction('suspend')}
              >
                <Ban className="h-4 w-4" /> Suspendre
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onAction('reset_password')}>
              <KeyRound className="h-4 w-4" /> Mot de passe
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

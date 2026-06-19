import { useEffect, useState } from 'react';
import { Ban, KeyRound, RotateCcw, Search } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner, EmptyState } from '@/components/ui/States';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAdminUsers, useAdminUserAction, useUpdateUserRole } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, initials } from '@/lib/utils';
import type { AdminUserAction } from '@/services/admin.service';
import type { Profile, UserRole } from '@/types/database';

const PAGE_SIZE = 20;

const ACTION_META: Record<
  AdminUserAction,
  { title: string; body: (name: string) => string; confirm: string; danger: boolean; success: string }
> = {
  suspend: {
    title: 'Suspendre le compte ?',
    body: (n) => `${n} ne pourra plus se connecter jusqu'à réactivation. Ses données sont conservées.`,
    confirm: 'Suspendre',
    danger: true,
    success: 'Compte suspendu.',
  },
  reactivate: {
    title: 'Réactiver le compte ?',
    body: (n) => `${n} pourra de nouveau se connecter.`,
    confirm: 'Réactiver',
    danger: false,
    success: 'Compte réactivé.',
  },
  reset_password: {
    title: 'Réinitialiser le mot de passe ?',
    body: (n) =>
      `Un email de réinitialisation sera envoyé à ${n}. Vous ne définissez pas le mot de passe vous-même.`,
    confirm: "Envoyer l'email",
    danger: false,
    success: 'Email de réinitialisation envoyé.',
  },
};

const ROLE_LABELS: Record<UserRole, string> = {
  visitor: 'Visiteur',
  producer: 'Producteur',
  buyer: 'Acheteur',
  admin: 'Administrateur',
};

const ROLE_STYLES: Record<UserRole, string> = {
  visitor: 'bg-gray-100 text-gray-600',
  producer: 'bg-primary-100 text-primary-700',
  buyer: 'bg-blue-100 text-blue-700',
  admin: 'bg-accent-100 text-accent-600',
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<{ userId: string; role: UserRole; name: string } | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{ action: AdminUserAction; user: Profile } | null>(null);
  const [detailUser, setDetailUser] = useState<Profile | null>(null);

  const { data, isLoading } = useAdminUsers(page, search);
  const { session } = useAuth();
  const updateRole = useUpdateUserRole();
  const userAction = useAdminUserAction();
  const { toast } = useToast();

  const runAction = async () => {
    if (!actionConfirm) return;
    const meta = ACTION_META[actionConfirm.action];
    try {
      await userAction.mutateAsync({ action: actionConfirm.action, userId: actionConfirm.user.id });
      toast(meta.success, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    } finally {
      setActionConfirm(null);
    }
  };

  // Recherche débouncée (évite une requête par frappe).
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const users = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const applyChange = async (userId: string, role: UserRole) => {
    try {
      await updateRole.mutateAsync({ userId, role });
      toast('Rôle mis à jour.', 'success');
    } catch {
      toast('Modification impossible.', 'error');
    }
  };

  // La promotion en administrateur (accès total) exige une confirmation.
  const requestChange = (u: Profile, role: UserRole) => {
    if (role === u.role) return;
    if (role === 'admin') setPending({ userId: u.id, role, name: u.full_name });
    else applyChange(u.id, role);
  };

  return (
    <>
      <Seo title="Gestion des utilisateurs" />
      <PageHeader title="Utilisateurs" description="Gérez les comptes et les rôles." />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          placeholder="Rechercher par nom ou email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Rechercher un utilisateur"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : users.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Utilisateur</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Contact</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Inscrit le</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 text-right font-medium">Modifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-display text-xs font-bold text-primary-700">
                          {initials(u.full_name)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetailUser(u)}
                          className="font-medium text-gray-900 hover:text-primary-700 hover:underline"
                        >
                          {u.full_name}
                        </button>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      <p>{u.email}</p>
                      {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className={ROLE_STYLES[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                        {u.suspended && <Badge className="bg-red-100 text-red-700">Suspendu</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <Select
                          value={u.role}
                          disabled={u.id === session?.user.id}
                          onChange={(e) => requestChange(u, e.target.value as UserRole)}
                          className="w-auto"
                          aria-label={`Rôle de ${u.full_name}`}
                        >
                          <option value="producer">Producteur</option>
                          <option value="buyer">Acheteur</option>
                          <option value="admin">Administrateur</option>
                          <option value="visitor">Visiteur</option>
                        </Select>
                        {u.id !== session?.user.id && (
                          <div className="flex gap-1">
                            {u.suspended ? (
                              <Button variant="ghost" size="sm" onClick={() => setActionConfirm({ action: 'reactivate', user: u })}>
                                <RotateCcw className="h-4 w-4" /> Réactiver
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setActionConfirm({ action: 'suspend', user: u })}
                              >
                                <Ban className="h-4 w-4" /> Suspendre
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setActionConfirm({ action: 'reset_password', user: u })}>
                              <KeyRound className="h-4 w-4" /> Mot de passe
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        <EmptyState title="Aucun utilisateur" description={search ? 'Aucun résultat pour cette recherche.' : undefined} />
      )}

      {/* Fiche détaillée de l'utilisateur */}
      <UserDetailModal
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onAction={(action) => {
          if (detailUser) setActionConfirm({ action, user: detailUser });
          setDetailUser(null);
        }}
      />

      {/* Confirmation de promotion administrateur */}
      <Modal open={!!pending} onClose={() => setPending(null)} title="Promouvoir en administrateur ?">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{pending?.name}</span> aura un accès total à la
          plateforme : modération des annonces, gestion des utilisateurs et des rôles. Confirmez-vous ?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setPending(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            loading={updateRole.isPending}
            onClick={async () => {
              if (pending) await applyChange(pending.userId, pending.role);
              setPending(null);
            }}
          >
            Promouvoir administrateur
          </Button>
        </div>
      </Modal>

      {/* Confirmation suspendre / réactiver / réinitialiser */}
      <Modal
        open={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        title={actionConfirm ? ACTION_META[actionConfirm.action].title : ''}
      >
        {actionConfirm && (
          <>
            <p className="text-sm text-gray-600">
              {ACTION_META[actionConfirm.action].body(actionConfirm.user.full_name)}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setActionConfirm(null)}>
                Annuler
              </Button>
              <Button
                variant={ACTION_META[actionConfirm.action].danger ? 'danger' : 'primary'}
                loading={userAction.isPending}
                onClick={runAction}
              >
                {ACTION_META[actionConfirm.action].confirm}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner, EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, initials } from '@/lib/utils';
import type { Profile, UserRole } from '@/types/database';

const PAGE_SIZE = 20;

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

  const { data, isLoading } = useAdminUsers(page, search);
  const { session } = useAuth();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

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
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      <p>{u.email}</p>
                      {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className={ROLE_STYLES[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
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
    </>
  );
}

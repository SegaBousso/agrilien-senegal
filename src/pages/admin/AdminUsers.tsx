import { Seo } from '@/components/Seo';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner, EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useAdmin';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, initials } from '@/lib/utils';
import type { UserRole } from '@/types/database';

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
  const { data: users, isLoading } = useAdminUsers();
  const { session } = useAuth();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

  const changeRole = async (userId: string, role: UserRole) => {
    try {
      await updateRole.mutateAsync({ userId, role });
      toast('Rôle mis à jour.', 'success');
    } catch {
      toast('Modification impossible.', 'error');
    }
  };

  return (
    <>
      <Seo title="Gestion des utilisateurs" />
      <PageHeader title="Utilisateurs" description="Gérez les comptes et les rôles." />

      {isLoading ? (
        <Spinner />
      ) : users && users.length > 0 ? (
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
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
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
      ) : (
        <EmptyState title="Aucun utilisateur" />
      )}
    </>
  );
}

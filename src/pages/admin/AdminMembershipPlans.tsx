import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Crown, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAllPlans, usePlanMutations } from '@/hooks/useMembershipPlans';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { membershipPlanSchema, type MembershipPlanInput } from '@/lib/validations';
import type { MembershipPlan } from '@/types/database';

export default function AdminMembershipPlans() {
  const { data: plans, isLoading } = useAllPlans();
  const { create, update, remove } = usePlanMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MembershipPlan | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MembershipPlanInput>({ resolver: zodResolver(membershipPlanSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', duration_days: 30, price: 0, description: '', highlight: false, sort_order: 0, is_active: true });
    setOpen(true);
  };

  const openEdit = (p: MembershipPlan) => {
    setEditing(p);
    reset({
      name: p.name,
      duration_days: p.duration_days,
      price: p.price,
      description: p.description ?? '',
      highlight: p.highlight,
      sort_order: p.sort_order,
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input: values });
      else await create.mutateAsync(values);
      toast(editing ? 'Forfait mis à jour.' : 'Forfait créé.', 'success');
      setOpen(false);
    } catch {
      toast('Enregistrement impossible (nom déjà utilisé ?).', 'error');
    }
  });

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast('Forfait supprimé.', 'success');
    } catch {
      toast('Suppression impossible.', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <Seo title="Forfaits d'adhésion" />
      <PageHeader
        title="Forfaits Partenaire"
        description="Tarifs de l'adhésion qui met les prestataires en avant au Carnet. Modifiables à tout moment."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Nouveau forfait
          </Button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-1.5 font-display font-semibold text-gray-900">
                    {p.highlight && <Crown className="h-4 w-4 text-accent-500" />}
                    {p.name}
                  </h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{formatPrice(p.price)}</p>
                  <p className="text-xs text-gray-500">{p.duration_days} jours</p>
                </div>
                <Badge className={p.is_active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}>
                  {p.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              {p.description && <p className="mt-2 text-sm text-gray-500">{p.description}</p>}
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" /> Modifier
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)}>
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun forfait" action={<Button onClick={openCreate}>Créer un forfait</Button>} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Modifier le forfait' : 'Nouveau forfait'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom" htmlFor="name" error={errors.name?.message} required hint="Ex. Mensuel, Trimestriel, Annuel">
            <Input id="name" {...register('name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prix (FCFA)" htmlFor="price" error={errors.price?.message} required>
              <Input id="price" type="number" min={0} step={500} {...register('price')} />
            </Field>
            <Field label="Durée (jours)" htmlFor="duration_days" error={errors.duration_days?.message} required>
              <Input id="duration_days" type="number" min={1} {...register('duration_days')} />
            </Field>
          </div>
          <Field label="Description" htmlFor="description" error={errors.description?.message} hint="Ex. argument d'économie">
            <Textarea id="description" rows={2} {...register('description')} />
          </Field>
          <Field label="Ordre d'affichage" htmlFor="sort_order" hint="Plus petit = en premier">
            <Input id="sort_order" type="number" min={0} {...register('sort_order')} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('highlight')} />
            Forfait « recommandé » (mis en avant)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('is_active')} />
            Forfait actif (proposé au public)
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer le forfait ?">
        <p className="text-sm text-gray-600">
          Supprimer « {toDelete?.name} » ? Les adhésions déjà payées ne sont pas affectées, mais le
          forfait ne sera plus proposé.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annuler
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={confirmDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </>
  );
}

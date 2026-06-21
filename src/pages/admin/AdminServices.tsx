import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAllServices, useServiceMutations } from '@/hooks/useServices';
import { useToast } from '@/context/ToastContext';
import { SERVICE_DOMAINS, SERVICE_DOMAIN_LABELS } from '@/lib/constants';
import { serviceSchema, type ServiceInput } from '@/lib/validations';
import type { Service } from '@/types/database';

export default function AdminServices() {
  const { data: services, isLoading } = useAllServices();
  const { create, update, remove } = useServiceMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceInput>({ resolver: zodResolver(serviceSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', domain: 'transport', description: '', icon: '', sort_order: 0, is_active: true });
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    reset({
      name: s.name,
      domain: s.domain,
      description: s.description ?? '',
      icon: s.icon ?? '',
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input: values });
      else await create.mutateAsync(values);
      toast(editing ? 'Service mis à jour.' : 'Service créé.', 'success');
      setOpen(false);
    } catch {
      toast('Enregistrement impossible (nom déjà utilisé ?).', 'error');
    }
  });

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast('Service supprimé.', 'success');
    } catch {
      toast('Suppression impossible.', 'error');
    } finally {
      setToDelete(null);
    }
  };

  const grouped = SERVICE_DOMAINS.map((d) => ({
    domain: d,
    items: (services ?? []).filter((s) => s.domain === d),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Seo title="Catalogue de services" />
      <PageHeader
        title="Catalogue de services"
        description="Définissez les services que les prestataires peuvent proposer (transport, mécanisation…)."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Nouveau service
          </Button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : services && services.length > 0 ? (
        <div className="space-y-7">
          {grouped.map((g) => (
            <section key={g.domain}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {SERVICE_DOMAIN_LABELS[g.domain]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-border bg-surface p-4 shadow-soft transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-gray-900">{s.name}</h3>
                        {s.description && <p className="mt-1 text-sm text-gray-500">{s.description}</p>}
                      </div>
                      <Badge className={s.is_active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}>
                        {s.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" /> Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setToDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun service" action={<Button onClick={openCreate}>Créer un service</Button>} />
      )}

      {/* Modale créer / éditer */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Modifier le service' : 'Nouveau service'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" placeholder="Ex. Labour au tracteur" {...register('name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Domaine" htmlFor="domain" error={errors.domain?.message} required>
              <Select id="domain" {...register('domain')}>
                {SERVICE_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {SERVICE_DOMAIN_LABELS[d]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ordre d'affichage" htmlFor="sort_order" hint="Plus petit = en premier">
              <Input id="sort_order" type="number" min={0} {...register('sort_order')} />
            </Field>
          </div>
          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={3} {...register('description')} />
          </Field>
          <Field label="Icône (nom Lucide, optionnel)" htmlFor="icon" hint="Ex. truck, tractor">
            <Input id="icon" {...register('icon')} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('is_active')} />
            Service actif (proposable et visible)
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

      {/* Confirmation suppression */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer le service ?">
        <p className="text-sm text-gray-600">
          Supprimer « {toDelete?.name} » ? Il sera retiré des fiches des prestataires qui le proposaient.
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

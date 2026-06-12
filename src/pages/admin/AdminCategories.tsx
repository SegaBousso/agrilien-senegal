import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCategories, useCategoryMutations } from '@/hooks/useCatalog';
import { useToast } from '@/context/ToastContext';
import { categorySchema, type CategoryInput } from '@/lib/validations';
import type { ProductCategory } from '@/types/database';

export default function AdminCategories() {
  const { data: categories, isLoading } = useCategories(false);
  const { create, update, remove } = useCategoryMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ProductCategory | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', icon: '', is_active: true });
    setOpen(true);
  };

  const openEdit = (c: ProductCategory) => {
    setEditing(c);
    reset({ name: c.name, description: c.description ?? '', icon: c.icon ?? '', is_active: c.is_active });
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input: values });
      else await create.mutateAsync(values);
      toast(editing ? 'Catégorie mise à jour.' : 'Catégorie créée.', 'success');
      setOpen(false);
    } catch {
      toast('Enregistrement impossible.', 'error');
    }
  });

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast('Catégorie supprimée.', 'success');
    } catch {
      toast('Suppression impossible (catégorie peut-être utilisée).', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <Seo title="Gestion des catégories" />
      <PageHeader
        title="Catégories"
        description="Gérez les catégories de produits agricoles."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Nouvelle catégorie
          </Button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : categories && categories.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-surface p-4 shadow-soft transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-gray-900">{c.name}</h3>
                  {c.description && <p className="mt-1 text-sm text-gray-500">{c.description}</p>}
                </div>
                <Badge className={c.is_active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" /> Modifier
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)}>
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune catégorie" action={<Button onClick={openCreate}>Créer une catégorie</Button>} />
      )}

      {/* Modale créer / éditer */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" {...register('name')} />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={3} {...register('description')} />
          </Field>
          <Field label="Icône (nom Lucide, optionnel)" htmlFor="icon" hint="Ex. wheat, apple, carrot">
            <Input id="icon" {...register('icon')} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('is_active')} />
            Catégorie active
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
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer la catégorie ?">
        <p className="text-sm text-gray-600">
          Supprimer « {toDelete?.name} » ? Les annonces associées perdront leur catégorie.
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

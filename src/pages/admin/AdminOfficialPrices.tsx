import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, Spinner } from '@/components/ui/States';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAllOfficialPrices, useOfficialPriceMutations } from '@/hooks/useOfficialPrices';
import { useToast } from '@/context/ToastContext';
import { isInForce } from '@/lib/officialPrice';
import { formatPrice } from '@/lib/utils';
import { UNITS } from '@/lib/constants';
import { officialPriceSchema, type OfficialPriceInput } from '@/lib/validations';
import type { OfficialPrice } from '@/types/database';

const EMPTY: OfficialPriceInput = {
  label: '',
  keyword: '',
  campaign: '',
  price: 0,
  unit: 'kg',
  source: '',
  starts_on: '',
  ends_on: '',
  active: true,
};

export default function AdminOfficialPrices() {
  const { data: prices, isLoading } = useAllOfficialPrices();
  const { create, update, remove } = useOfficialPriceMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<OfficialPrice | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<OfficialPrice | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OfficialPriceInput>({ resolver: zodResolver(officialPriceSchema), defaultValues: EMPTY });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: OfficialPrice) => {
    setEditing(p);
    reset({
      label: p.label,
      keyword: p.keyword,
      campaign: p.campaign ?? '',
      price: p.price,
      unit: p.unit as OfficialPriceInput['unit'],
      source: p.source ?? '',
      starts_on: p.starts_on ?? '',
      ends_on: p.ends_on ?? '',
      active: p.active,
    });
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) await update.mutateAsync({ id: editing.id, input: values });
      else await create.mutateAsync(values);
      toast(editing ? 'Prix officiel mis à jour.' : 'Prix officiel ajouté.', 'success');
      setOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Enregistrement impossible.', 'error');
    }
  });

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast('Prix officiel supprimé.', 'success');
    } catch {
      toast('Suppression impossible.', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <Seo title="Prix officiels" />
      <PageHeader
        title="Prix officiels"
        description="Prix de référence fixés par l'État (filières régulées, ex. arachide). Affichés sur les annonces concernées ; un producteur est averti s'il publie sous le plancher."
        action={
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Nouveau prix
          </Button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : prices && prices.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Mot-clé</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Campagne</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">État</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prices.map((p) => {
                const live = isInForce(p);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.label}</p>
                      {p.source && <p className="text-xs text-gray-400">{p.source}</p>}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-gray-500 sm:table-cell">{p.keyword}</td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{p.campaign ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatPrice(p.price)}
                      <span className="text-xs font-normal text-gray-400">/{p.unit}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={live ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}>
                        {live ? 'En vigueur' : p.active ? 'Hors période' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" /> Modifier
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Landmark className="h-12 w-12" />}
          title="Aucun prix officiel"
          description="Ajoutez par exemple le prix au producteur de l'arachide pour la campagne en cours."
          action={<Button onClick={openCreate}>Ajouter un prix</Button>}
        />
      )}

      {/* Modale créer / éditer */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Modifier le prix officiel' : 'Nouveau prix officiel'}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Produit (libellé)" htmlFor="label" error={errors.label?.message} required>
              <Input id="label" placeholder="Arachide" {...register('label')} />
            </Field>
            <Field label="Mot-clé (dans le titre)" htmlFor="keyword" error={errors.keyword?.message} hint="Recherché dans le titre des annonces" required>
              <Input id="keyword" placeholder="arachide" {...register('keyword')} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Prix" htmlFor="price" error={errors.price?.message} required>
              <Input id="price" type="number" step="any" min={0} {...register('price')} />
            </Field>
            <Field label="Unité" htmlFor="unit" error={errors.unit?.message} required>
              <Select id="unit" {...register('unit')}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Campagne" htmlFor="campaign" hint="ex. 2025/2026">
              <Input id="campaign" placeholder="2025/2026" {...register('campaign')} />
            </Field>
          </div>
          <Field label="Source (facultatif)" htmlFor="source" hint="ex. CNIA / Ministère de l'Agriculture">
            <Input id="source" {...register('source')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Début de validité" htmlFor="starts_on" hint="Facultatif">
              <Input id="starts_on" type="date" {...register('starts_on')} />
            </Field>
            <Field label="Fin de validité" htmlFor="ends_on" hint="Facultatif">
              <Input id="ends_on" type="date" {...register('ends_on')} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register('active')} />
            Actif
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation suppression */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer ce prix officiel ?">
        <p className="text-sm text-gray-600">
          Supprimer la référence « {toDelete?.label} » ? Les annonces concernées n'afficheront plus ce prix.
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

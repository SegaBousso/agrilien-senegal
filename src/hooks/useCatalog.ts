import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchRegions,
  updateCategory,
} from '@/services/catalog.service';
import type { CategoryInput } from '@/lib/validations';

export function useCategories(activeOnly = true) {
  return useQuery({
    queryKey: ['categories', activeOnly],
    queryFn: () => fetchCategories(activeOnly),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const create = useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      updateCategory(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

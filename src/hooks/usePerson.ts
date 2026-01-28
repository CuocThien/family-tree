import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IPerson } from '@/types/person';
import { CreatePersonDto, UpdatePersonDto } from '@/types/dtos/person';
import { treeKeys } from './useTree';

export const personKeys = {
  all: ['persons'] as const,
  byTree: (treeId: string) => [...personKeys.all, 'tree', treeId] as const,
  detail: (id: string) => [...personKeys.all, id] as const,
  family: (id: string) => [...personKeys.detail(id), 'family'] as const,
  ancestors: (id: string, generations?: number) =>
    [...personKeys.detail(id), 'ancestors', generations] as const,
};

// Fetch persons by tree
export function usePersonsByTree(treeId: string) {
  return useQuery({
    queryKey: personKeys.byTree(treeId),
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}/persons`);
      if (!response.ok) throw new Error('Failed to fetch persons');
      const { data } = await response.json();
      return data as IPerson[];
    },
    enabled: !!treeId,
  });
}

// Fetch single person
export function usePerson(personId: string) {
  return useQuery({
    queryKey: personKeys.detail(personId),
    queryFn: async () => {
      const response = await fetch(`/api/persons/${personId}`);
      if (!response.ok) throw new Error('Failed to fetch person');
      const { data } = await response.json();
      return data as IPerson;
    },
    enabled: !!personId,
  });
}

// Create person
export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePersonDto & { treeId: string }) => {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create person');
      }
      const { data: person } = await response.json();
      return person as IPerson;
    },
    onSuccess: (newPerson) => {
      // Add to tree's person list
      queryClient.setQueryData<IPerson[]>(
        personKeys.byTree(newPerson.treeId),
        (old) => (old ? [...old, newPerson] : [newPerson])
      );
      queryClient.setQueryData(personKeys.detail(newPerson._id), newPerson);

      // Invalidate tree stats
      queryClient.invalidateQueries({ queryKey: treeKeys.stats(newPerson.treeId) });
    },
  });
}

// Update person
export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePersonDto }) => {
      const response = await fetch(`/api/persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update person');
      }
      const { data: person } = await response.json();
      return person as IPerson;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: personKeys.detail(id) });
      const previousPerson = queryClient.getQueryData<IPerson>(personKeys.detail(id));

      if (previousPerson) {
        queryClient.setQueryData<IPerson>(personKeys.detail(id), {
          ...previousPerson,
          ...data,
        });
      }

      return { previousPerson };
    },
    onError: (err, { id }, context) => {
      if (context?.previousPerson) {
        queryClient.setQueryData(personKeys.detail(id), context.previousPerson);
      }
    },
    onSettled: (person) => {
      if (person) {
        queryClient.invalidateQueries({ queryKey: personKeys.detail(person._id) });
        queryClient.invalidateQueries({ queryKey: personKeys.byTree(person.treeId) });
      }
    },
  });
}

// Delete person
export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, treeId }: { id: string; treeId: string }) => {
      const response = await fetch(`/api/persons/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete person');
      }
      return { id, treeId };
    },
    onSuccess: ({ id, treeId }) => {
      queryClient.setQueryData<IPerson[]>(personKeys.byTree(treeId), (old) =>
        old?.filter((p) => p._id !== id)
      );
      queryClient.removeQueries({ queryKey: personKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: treeKeys.stats(treeId) });
    },
  });
}

// Get family members
export function useFamily(personId: string) {
  return useQuery({
    queryKey: personKeys.family(personId),
    queryFn: async () => {
      const response = await fetch(`/api/persons/${personId}/family`);
      if (!response.ok) throw new Error('Failed to fetch family');
      const { data } = await response.json();
      return data as {
        parents: IPerson[];
        children: IPerson[];
        spouses: IPerson[];
        siblings: IPerson[];
      };
    },
    enabled: !!personId,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ITree } from '@/types/tree';
import { CreateTreeDto, UpdateTreeDto } from '@/types/dtos/tree';

// Query keys factory
export const treeKeys = {
  all: ['trees'] as const,
  lists: () => [...treeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...treeKeys.lists(), filters] as const,
  details: () => [...treeKeys.all, 'detail'] as const,
  detail: (id: string) => [...treeKeys.details(), id] as const,
  stats: (id: string) => [...treeKeys.detail(id), 'stats'] as const,
};

// Fetch single tree
export function useTree(treeId: string) {
  return useQuery({
    queryKey: treeKeys.detail(treeId),
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tree');
      }
      const { data } = await response.json();
      return data as ITree;
    },
    enabled: !!treeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch user's trees
export function useTrees() {
  return useQuery({
    queryKey: treeKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/trees');
      if (!response.ok) {
        throw new Error('Failed to fetch trees');
      }
      const { data } = await response.json();
      return data as ITree[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Create tree mutation
export function useCreateTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTreeDto) => {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create tree');
      }
      const { data: tree } = await response.json();
      return tree as ITree;
    },
    onSuccess: (newTree) => {
      // Update cache
      queryClient.setQueryData<ITree[]>(treeKeys.lists(), (old) =>
        old ? [...old, newTree] : [newTree]
      );
      queryClient.setQueryData(treeKeys.detail(newTree._id), newTree);
    },
  });
}

// Update tree mutation
export function useUpdateTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTreeDto }) => {
      const response = await fetch(`/api/trees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update tree');
      }
      const { data: tree } = await response.json();
      return tree as ITree;
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: treeKeys.detail(id) });
      const previousTree = queryClient.getQueryData<ITree>(treeKeys.detail(id));

      if (previousTree) {
        queryClient.setQueryData<ITree>(treeKeys.detail(id), {
          ...previousTree,
          ...data,
        });
      }

      return { previousTree };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTree) {
        queryClient.setQueryData(treeKeys.detail(id), context.previousTree);
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: treeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: treeKeys.lists() });
    },
  });
}

// Delete tree mutation
export function useDeleteTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/trees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete tree');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueryData<ITree[]>(treeKeys.lists(), (old) =>
        old?.filter((tree) => tree._id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: treeKeys.detail(deletedId) });
    },
  });
}

// Tree stats
export function useTreeStats(treeId: string) {
  return useQuery({
    queryKey: treeKeys.stats(treeId),
    queryFn: async () => {
      const response = await fetch(`/api/trees/${treeId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const { data } = await response.json();
      return data;
    },
    enabled: !!treeId,
    staleTime: 60 * 1000, // 1 minute
  });
}

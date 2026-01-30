import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { TreeFormInput } from '@/schemas/tree';
import type { ITree } from '@/types/tree';

interface CreateTreeResponse {
  success: boolean;
  data?: ITree;
  error?: string;
}

export function useCreateTree() {
  const { data: session } = useSession();

  const createTree = useMutation({
    mutationFn: async (data: TreeFormInput): Promise<CreateTreeResponse> => {
      if (!session?.user?.id) {
        return {
          success: false,
          error: 'You must be logged in to create a tree',
        };
      }

      try {
        const response = await fetch('/api/trees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            visibility: data.visibility,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: result.error || 'Failed to create tree',
          };
        }

        return {
          success: true,
          data: result.data,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create tree',
        };
      }
    },
  });

  return { createTree };
}

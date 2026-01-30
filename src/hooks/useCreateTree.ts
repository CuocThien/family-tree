import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { container } from '@/lib/di';
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
        const treeService = container.treeService;
        const newTree = await treeService.createTree(session.user.id, {
          name: data.name,
          rootPersonId: undefined,
          settings: {
            isPublic: data.visibility === 'public',
            allowComments: true,
          },
        });

        return {
          success: true,
          data: newTree,
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

import { useQuery } from '@tanstack/react-query';
import { ITree } from '@/types/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

interface TreeDataResponse {
  tree: ITree;
  persons: IPerson[];
  relationships: IRelationship[];
}

export function useTreeData(treeId: string, userId: string) {
  return useQuery({
    queryKey: ['tree-data', treeId],
    queryFn: async (): Promise<TreeDataResponse> => {
      const [treeRes, personsRes, relationshipsRes] = await Promise.all([
        fetch(`/api/trees/${treeId}`),
        fetch(`/api/trees/${treeId}/persons?limit=1000`),
        fetch(`/api/trees/${treeId}/relationships?limit=1000`),
      ]);

      if (!treeRes.ok) {
        throw new Error('Failed to fetch tree');
      }
      if (!personsRes.ok) {
        throw new Error('Failed to fetch persons');
      }
      if (!relationshipsRes.ok) {
        throw new Error('Failed to fetch relationships');
      }

      const treeData = await treeRes.json();
      const personsData = await personsRes.json();
      const relationshipsData = await relationshipsRes.json();

      return {
        tree: treeData.data as ITree,
        persons: personsData.data as IPerson[],
        relationships: (relationshipsData.data || []) as IRelationship[],
      };
    },
    enabled: !!treeId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

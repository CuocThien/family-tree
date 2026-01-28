import { useRouter } from 'next/navigation';
import { TreeCard } from '@/components/tree/TreeCard';
import type { ITree } from '@/types/tree';

export interface TreeGridProps {
  trees: Array<ITree & { memberCount: number; lastUpdated: Date; isMain?: boolean; coverImage?: string }>;
  limit?: number;
  emptyState?: React.ReactNode;
}

export function TreeGrid({ trees, limit, emptyState }: TreeGridProps) {
  const router = useRouter();
  const displayTrees = limit ? trees.slice(0, limit) : trees;

  if (trees.length === 0) {
    return (
      emptyState || (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[#4c8d9a]">No family trees yet. Create your first tree to get started!</p>
        </div>
      )
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {displayTrees.map((tree) => (
        <TreeCard
          key={tree._id}
          tree={tree}
          memberCount={tree.memberCount}
          lastUpdated={tree.lastUpdated}
          isMain={tree.isMain}
          coverImage={tree.coverImage}
          onClick={() => router.push(`/trees/${tree._id}`)}
        />
      ))}
    </div>
  );
}

TreeGrid.displayName = 'TreeGrid';

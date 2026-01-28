'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { FloatingControls } from '@/components/tree/FloatingControls';
import { NodeTooltip } from '@/components/tree/NodeTooltip';
import { TreeBoardSkeleton } from '@/components/tree/TreeBoardSkeleton';
import { useTreeData } from '@/hooks/useTreeData';
import { calculatePedigreeLayout } from '@/lib/tree-layout/pedigree';
import { Node, NodeMouseHandler } from 'reactflow';

interface TreeBoardContentProps {
  treeId: string;
  userId: string;
}

export function TreeBoardContent({ treeId, userId }: TreeBoardContentProps) {
  const { setTreeData, setRootPerson, reset } = useTreeBoardStore();

  const { data, isLoading, error } = useTreeData(treeId, userId);

  useEffect(() => {
    if (data) {
      setTreeData(treeId, data.persons, data.relationships);
      if (data.tree.rootPersonId) {
        setRootPerson(data.tree.rootPersonId);
      }
    }

    return () => {
      reset();
    };
  }, [data, treeId, setTreeData, setRootPerson, reset]);

  if (isLoading) {
    return <TreeBoardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Tree</h2>
          <p className="text-gray-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.persons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No People in Tree</h2>
          <p className="text-gray-600 mt-2">Add your first person to get started.</p>
        </div>
      </div>
    );
  }

  const rootPersonId = data.tree.rootPersonId || data.persons[0]._id;

  const { nodes, edges } = useMemo(
    () =>
      calculatePedigreeLayout(rootPersonId, data.persons, data.relationships),
    [rootPersonId, data.persons, data.relationships]
  );

  const handleNodeClick: NodeMouseHandler = useCallback((event, node: Node) => {
    useTreeBoardStore.getState().selectPerson(node.id);
  }, []);

  const handleNodeDoubleClick: NodeMouseHandler = useCallback((event, node: Node) => {
    // TODO(FEAT-XXX): Navigate to person profile
    // Navigate to person profile page
  }, []);

  return (
    <div className="relative w-full h-full">
      <TreeCanvas
        initialNodes={nodes}
        initialEdges={edges}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
      />
      <FloatingControls />
      <NodeTooltip />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { TreeBoardHeader } from '@/components/tree/TreeBoardHeader';
import { FilterPanel } from '@/components/tree/FilterPanel';
import { TreeCanvas } from '@/components/tree/TreeCanvas';
import { FloatingControls } from '@/components/tree/FloatingControls';
import { MiniMap } from '@/components/tree/MiniMap';
import { NodeTooltip } from '@/components/tree/NodeTooltip';
import { TreeBoardSkeleton } from '@/components/tree/TreeBoardSkeleton';
import { AddPersonModal } from '@/components/person/AddPersonModal';
import { useTreeData } from '@/hooks/useTreeData';
import { useAddPersonToTree } from '@/hooks/useAddPersonToTree';
import { calculatePedigreeLayout } from '@/lib/tree-layout/pedigree';
import { Node, NodeMouseHandler } from 'reactflow';
import { Plus } from 'lucide-react';

interface TreeBoardContentProps {
  treeId: string;
  userId: string;
}

export function TreeBoardContent({ treeId, userId }: TreeBoardContentProps) {
  const { setTreeData, setRootPerson, reset } = useTreeBoardStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addPerson } = useAddPersonToTree();

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

  // Calculate layout - must be called before any conditional returns to satisfy Rules of Hooks
  const { nodes, edges } = useMemo(() => {
    if (!data || data.persons.length === 0) {
      return { nodes: [], edges: [] };
    }
    const rootPersonId = data.tree.rootPersonId || data.persons[0]._id;
    return calculatePedigreeLayout(rootPersonId, data.persons, data.relationships);
  }, [data]);

  const handleNodeClick: NodeMouseHandler = useCallback((event, node: Node) => {
    useTreeBoardStore.getState().selectPerson(node.id);
  }, []);

  const handleNodeDoubleClick: NodeMouseHandler = useCallback((event, node: Node) => {
    // Navigate to person profile page
    window.location.href = `/dashboard/trees/${treeId}/persons/${node.id}`;
  }, [treeId]);

  if (isLoading) {
    return <TreeBoardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Tree</h2>
          <p className="text-gray-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.persons.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="size-20 rounded-full bg-[#13c8ec]/10 flex items-center justify-center">
              <Plus className="h-10 w-10 text-[#13c8ec]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#0d191b] dark:text-white mb-2">
            No People in Tree
          </h2>
          <p className="text-[#4c8d9a] mb-6">Add your first person to get started.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#13c8ec] text-white rounded-xl font-bold shadow-lg shadow-[#13c8ec]/25 hover:brightness-110 transition-all"
          >
            <Plus size={20} />
            <span>Add First Person</span>
          </button>
        </div>
        <AddPersonModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          treeId={treeId}
          onCreate={async (newData) => {
            const result = await addPerson.mutateAsync({ ...newData, treeId });
            return result;
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Header */}
      <TreeBoardHeader tree={data.tree} />

      <main className="relative flex flex-1 overflow-hidden">
        {/* Left Filter Panel */}
        <FilterPanel treeId={treeId} />

        {/* Main Canvas Area */}
        <div className="relative flex-1 bg-background-light dark:bg-background-dark canvas-grid overflow-hidden">
          <ReactFlowProvider>
            <TreeCanvas
              initialNodes={nodes}
              initialEdges={edges}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
            />
            <MiniMap />
            <NodeTooltip />
          </ReactFlowProvider>
        </div>
      </main>

      {/* Floating Controls */}
      <FloatingControls treeId={treeId} />
    </div>
  );
}

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
import { EditPersonModal } from '@/components/person/EditPersonModal';
import { useTreeData } from '@/hooks/useTreeData';
import { useAddPersonToTree } from '@/hooks/useAddPersonToTree';
import { useUpdatePerson } from '@/hooks/usePerson';
import { usePersonRelationships } from '@/hooks/usePersonRelationships';
import { calculatePedigreeLayout } from '@/lib/tree-layout/pedigree';
import { normalizeRelationshipType } from '@/utils/relationshipNormalization';
import { Node, NodeMouseHandler } from 'reactflow';
import { Plus } from 'lucide-react';

interface TreeBoardContentProps {
  treeId: string;
  userId: string;
}

export function TreeBoardContent({ treeId, userId }: TreeBoardContentProps) {
  const { setTreeData, setRootPerson, reset, selectPerson } = useTreeBoardStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { addPerson } = useAddPersonToTree();
  const updatePerson = useUpdatePerson();

  const { data, isLoading, error } = useTreeData(treeId, userId);

  // Selector for the currently selected person from the Zustand store
  const selectedPerson = useTreeBoardStore((state) =>
    state.selectedPersonId ? state.persons.get(state.selectedPersonId) : null
  );

  // Fetch relationships for the selected person
  const { data: personRelationships = [], isLoading: isFetchingRelationships } = usePersonRelationships({
    personId: selectedPerson?._id || '',
    enabled: isEditModalOpen && !!selectedPerson?._id,
  });

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
    selectPerson(node.id);
    setIsEditModalOpen(true);
  }, [selectPerson]);

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
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No People in Tree
          </h2>
          <p className="text-secondary mb-6">Add your first person to get started.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
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
        <div className="relative flex-1 bg-surface-elevated overflow-hidden">
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

      {/* Edit Person Modal */}
      {selectedPerson && (
        <EditPersonModal
          key={selectedPerson._id}
          isOpen={isEditModalOpen}
          person={selectedPerson}
          treeId={treeId}
          existingRelationships={personRelationships}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={async (data) => {
            try {
              // Update person details
              await updatePerson.mutateAsync({
                id: selectedPerson._id,
                data: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  middleName: data.middleName,
                  suffix: data.suffix,
                  gender: data.gender,
                  dateOfBirth: data.birthDate ? new Date(data.birthDate) : undefined,
                  dateOfDeath: data.deathDate ? new Date(data.deathDate) : undefined,
                  birthPlace: data.birthPlace,
                  deathPlace: data.deathPlace,
                  biography: data.biography,
                  occupation: data.occupation,
                  nationality: data.nationality,
                },
              });

              // Handle relationship updates if provided
              if (data.relationships && Array.isArray(data.relationships)) {
                const submittedRelationships = data.relationships;
                const existingRelationshipsMap = new Map(
                  personRelationships.map((rel) => [rel.relatedPersonId, rel])
                );

                // Create new relationships
                for (const rel of submittedRelationships) {
                  if (!existingRelationshipsMap.has(rel.relatedPersonId)) {
                    // This is a new relationship
                    const normalized = normalizeRelationshipType(
                      rel.relationshipType,
                      rel.relatedPersonId,
                      selectedPerson._id
                    );

                    await fetch('/api/relationships', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        treeId,
                        fromPersonId: normalized.fromPersonId,
                        toPersonId: normalized.toPersonId,
                        type: normalized.type,
                      }),
                    });
                  }
                  // If relationship exists, we could handle type changes here
                  // For now, we assume the user removes and re-adds to change type
                }

                // Delete removed relationships
                for (const existingRel of personRelationships) {
                  const stillExists = submittedRelationships.some(
                    (rel) => rel.relatedPersonId === existingRel.relatedPersonId
                  );

                  if (!stillExists) {
                    // This relationship was removed
                    await fetch(`/api/relationships/${existingRel._id}`, {
                      method: 'DELETE',
                    });
                  }
                }
              }

              setIsEditModalOpen(false);
              return { success: true };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update person',
              };
            }
          }}
        />
      )}
    </div>
  );
}

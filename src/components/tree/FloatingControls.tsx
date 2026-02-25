'use client';

import { useState } from 'react';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { AddPersonModal } from '@/components/person/AddPersonModal';
import { useCallback } from 'react';
import { useAddPersonToTree } from '@/hooks/useAddPersonToTree';

interface FloatingControlsProps {
  treeId: string;
}

export function FloatingControls({ treeId }: FloatingControlsProps) {
  const {
    viewport,
    zoomIn,
    zoomOut,
    fitToScreen,
  } = useTreeBoardStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addPerson } = useAddPersonToTree();

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitToScreen = useCallback(() => {
    fitToScreen();
  }, [fitToScreen]);

  const handleAddPerson = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  return (
    <>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 rounded-2xl bg-surface/90 backdrop-blur-md shadow-2xl border border-white/20 dark:border-border">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-3 border-r border-border">
          <button
            onClick={handleZoomOut}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-surface-elevated text-secondary hover:text-primary transition-all"
            aria-label="Zoom out"
          >
            <MaterialSymbol icon="zoom_out" />
          </button>
          <span className="text-xs font-bold text-foreground w-12 text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-surface-elevated text-secondary hover:text-primary transition-all"
            aria-label="Zoom in"
          >
            <MaterialSymbol icon="zoom_in" />
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={handleFitToScreen}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-surface-elevated text-secondary hover:text-primary transition-all"
            aria-label="Recenter view"
          >
            <MaterialSymbol icon="my_location" />
          </button>
          <button
            className="size-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-all"
            aria-label="Pan tool"
          >
            <MaterialSymbol icon="pan_tool" />
          </button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Quick Add Button */}
        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
          onClick={handleAddPerson}
        >
          <MaterialSymbol icon="person_add" className="text-xl" />
          <span className="text-sm">Quick Add</span>
        </button>
      </div>

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        treeId={treeId}
        onCreate={async (data) => {
          const result = await addPerson.mutateAsync({ ...data, treeId });
          return result;
        }}
      />
    </>
  );
}

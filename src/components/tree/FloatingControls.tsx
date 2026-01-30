'use client';

import { useState } from 'react';
import { useTreeBoardStore, ViewMode } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { AddPersonModal } from '@/components/person/AddPersonModal';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAddPersonToTree } from '@/hooks/useAddPersonToTree';
import { useRouter } from 'next/navigation';

const VIEW_MODES: { label: string; value: ViewMode }[] = [
  { label: 'Pedigree View', value: 'pedigree' },
  { label: 'Fan Chart', value: 'fan' },
];

interface FloatingControlsProps {
  treeId: string;
}

export function FloatingControls({ treeId }: FloatingControlsProps) {
  const {
    viewport,
    zoomIn,
    zoomOut,
    fitToScreen,
    setViewMode,
    viewMode,
  } = useTreeBoardStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addPerson } = useAddPersonToTree();
  const router = useRouter();

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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 rounded-2xl bg-white/90 dark:bg-background-dark/90 backdrop-blur-md shadow-2xl border border-white/20 dark:border-[#1e2f32]">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-2 border-r border-[#e7f1f3] dark:border-[#1e2f32]">
        <button
          onClick={handleZoomOut}
          className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
          aria-label="Zoom out"
        >
          <MaterialSymbol icon="zoom_out" />
        </button>
        <span className="text-xs font-bold text-[#4c8d9a] w-12 text-center">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
          aria-label="Zoom in"
        >
          <MaterialSymbol icon="zoom_in" />
        </button>
      </div>

      {/* Fit View */}
      <button
        onClick={handleFitToScreen}
        className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
        aria-label="Fit view"
      >
        <MaterialSymbol icon="my_location" />
      </button>

      {/* Pan Mode Toggle */}
      <button
        className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light dark:hover:bg-[#1e2f32] transition-colors"
        aria-label="Pan mode"
      >
        <MaterialSymbol icon="pan_tool" />
      </button>

      <div className="w-px h-6 bg-[#e7f1f3] dark:bg-[#1e2f32] mx-1" />

      {/* View Mode Toggle */}
      <div className="flex h-10 items-center justify-center rounded-xl bg-[#e7f1f3] dark:bg-[#1e2f32] p-1">
        {VIEW_MODES.map((mode) => (
          <label
            key={mode.value}
            className={cn(
              'flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium transition-all',
              viewMode === mode.value
                ? 'bg-white dark:bg-[#2d3a3c] shadow-sm text-primary'
                : 'text-[#4c8d9a] hover:text-primary'
            )}
          >
            <span className="truncate">{mode.label}</span>
            <input
              type="radio"
              name="view-toggle"
              checked={viewMode === mode.value}
              onChange={() => setViewMode(mode.value)}
              className="hidden"
            />
          </label>
        ))}
      </div>

      <div className="w-px h-6 bg-[#e7f1f3] dark:bg-[#1e2f32] mx-1" />

      {/* Quick Add Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
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
        if (result.success) {
          // Refresh the page to show the new person
          router.refresh();
        }
        return result;
      }}
    />
  );
}

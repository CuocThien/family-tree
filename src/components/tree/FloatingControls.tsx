'use client';

import { Plus, ZoomIn, ZoomOut, Maximize2, Minimize2, Navigation } from 'lucide-react';
import { useTreeBoardStore, ViewMode } from '@/store/treeBoardStore';
import { Button } from '@/components/ui/Button';
import { useCallback } from 'react';

const VIEW_MODES: ViewMode[] = ['pedigree', 'fan', 'timeline', 'vertical'];

export function FloatingControls() {
  const {
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    toggleMinimap,
    showMinimap,
    setViewMode,
    viewMode,
  } = useTreeBoardStore();

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleResetZoom = useCallback(() => {
    resetZoom();
  }, [resetZoom]);

  const handleFitToScreen = useCallback(() => {
    fitToScreen();
  }, [fitToScreen]);

  const handleToggleMinimap = useCallback(() => {
    toggleMinimap();
  }, [toggleMinimap]);

  const handleViewModeChange = useCallback(() => {
    const currentIndex = VIEW_MODES.indexOf(viewMode);
    const nextMode = VIEW_MODES[(currentIndex + 1) % VIEW_MODES.length];
    setViewMode(nextMode);
  }, [viewMode, setViewMode]);

  const handleAddPerson = useCallback(() => {
    // TODO(FEAT-XXX): Open add person modal
  }, []);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white/90 dark:bg-[#101f22]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-white/10 p-2 flex items-center gap-2">
        {/* Add Person Button */}
        <Button
          size="sm"
          variant="primary"
          onClick={handleAddPerson}
          className="gap-1.5"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Person</span>
        </Button>

        <div className="w-px h-6 bg-[#e7f1f3] dark:bg-white/10" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={viewport.zoom <= 0.1}
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </Button>

          <span className="text-xs font-medium text-[#4c8d9a] w-12 text-center tabular-nums">
            {Math.round(viewport.zoom * 100)}%
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={viewport.zoom >= 2}
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-[#e7f1f3] dark:bg-white/10" />

        {/* View Controls */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetZoom}
          aria-label="Reset zoom"
          title="Reset zoom"
        >
          <Minimize2 size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleFitToScreen}
          aria-label="Fit to screen"
          title="Fit to screen"
        >
          <Maximize2 size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleMinimap}
          aria-label={showMinimap ? 'Hide minimap' : 'Show minimap'}
          title={showMinimap ? 'Hide minimap' : 'Show minimap'}
          className={showMinimap ? 'text-[#13c8ec]' : ''}
        >
          <Navigation size={16} />
        </Button>

        <div className="w-px h-6 bg-[#e7f1f3] dark:bg-white/10" />

        {/* View Mode Toggle */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleViewModeChange}
          aria-label={`View mode: ${viewMode}`}
          title={`View mode: ${viewMode}`}
        >
          <span className="text-xs font-medium capitalize">{viewMode}</span>
        </Button>
      </div>
    </div>
  );
}

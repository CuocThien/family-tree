'use client';

import { memo } from 'react';
import { useTreeBoardStore } from '@/store/treeBoardStore';

export const MiniMap = memo(function MiniMap() {
  return (
    <div className="absolute top-6 right-6 z-10 w-48 h-32 bg-surface/80 dark:bg-surface/80 backdrop-blur rounded-xl border border-border shadow-lg overflow-hidden">
      {/* Grid Background */}
      <div
        className="w-full h-full opacity-30"
        style={{
          backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Viewport Indicator */}
      <div className="absolute inset-0 border-2 border-primary/40 rounded-lg m-6 pointer-events-none" />

      {/* Label */}
      <p className="absolute bottom-2 left-2 text-[8px] font-bold uppercase tracking-widest text-secondary">
        Navigator
      </p>
    </div>
  );
});

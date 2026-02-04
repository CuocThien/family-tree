'use client';

import { memo } from 'react';
import { useTreeBoardStore } from '@/store/treeBoardStore';

export const MiniMap = memo(function MiniMap() {
  const filteredPersons = useTreeBoardStore((state) => state.getFilteredPersons());

  return (
    <div className="absolute top-6 right-6 z-10 w-48 h-32 bg-surface/80 backdrop-blur rounded-xl border border-border shadow-lg overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `
          linear-gradient(to right, #4c8d9a 1px, transparent 1px),
          linear-gradient(to bottom, #4c8d9a 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }} />

      {/* Viewport Indicator */}
      <div className="absolute inset-0 border-2 border-primary/40 rounded-lg m-6 pointer-events-none" />

      {/* Node Indicators - simplified positioning based on index */}
      {filteredPersons.slice(0, 50).map((person, index) => (
        <div
          key={person._id}
          className="absolute w-2 h-2 rounded-full bg-primary transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${20 + (index % 10) * 8}%`,
            top: `${20 + Math.floor(index / 10) * 15}%`,
          }}
        />
      ))}

      {/* Label */}
      <p className="absolute bottom-2 left-2 text-[8px] font-bold uppercase tracking-widest text-secondary">
        Navigator
      </p>
    </div>
  );
});

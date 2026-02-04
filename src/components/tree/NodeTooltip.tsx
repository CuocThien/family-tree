'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTreeBoardStore } from '@/store/treeBoardStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn, formatLifespan } from '@/lib/utils';

export function NodeTooltip() {
  const { tooltip, persons, hideTooltip } = useTreeBoardStore();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const person = tooltip.personId ? persons.get(tooltip.personId) : null;
  const [position, setPosition] = useState(tooltip.position);

  useEffect(() => {
    if (tooltip.visible && tooltipRef.current) {
      // Ensure tooltip stays within viewport bounds
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = tooltip.position;

      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
      }
      if (y + rect.height > viewportHeight - 20) {
        y = viewportHeight - rect.height - 20;
      }
      if (x < 20) x = 20;
      if (y < 20) y = 20;

      setPosition({ x, y });
    }
  }, [tooltip.visible, tooltip.position]);

  if (!tooltip.visible || !person) {
    return null;
  }

  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const hasPhoto = person.photos && person.photos.length > 0;
  const photoUrl = hasPhoto ? person.photos[0] : undefined;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'absolute z-50 w-72 bg-surface-elevated rounded-xl shadow-2xl',
        'border border-border overflow-hidden',
        'transition-opacity duration-150',
        tooltip.visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header with avatar and close button */}
      <div className="relative p-4 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
        <button
          onClick={hideTooltip}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close tooltip"
        >
          <X size={16} className="text-secondary" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <Avatar
            src={photoUrl}
            fullName={fullName}
            size="lg"
            className="ring-2 ring-primary/20"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {fullName}
            </h3>
            <p className="text-sm text-secondary">
              {formatLifespan(person.dateOfBirth, person.dateOfDeath)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Biography preview */}
        {person.biography ? (
          <p className="text-sm text-secondary line-clamp-3">
            {person.biography}
          </p>
        ) : (
          <p className="text-sm text-secondary/60 italic">
            No biography available.
          </p>
        )}

        {/* Quick facts */}
        <div className="space-y-1 text-xs">
          {person.gender && (
            <div className="flex justify-between">
              <span className="text-secondary">Gender</span>
              <span className="text-foreground font-medium capitalize">
                {person.gender}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <Button
          size="sm"
          variant="primary"
          className="flex-1"
          onClick={() => {
            // TODO(FEAT-XXX): Navigate to person profile
            hideTooltip();
          }}
        >
          View Profile
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => {
            // TODO(FEAT-XXX): Open edit facts form
            hideTooltip();
          }}
        >
          Edit Facts
        </Button>
      </div>

      {/* Arrow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-surface-elevated" />
      </div>
    </div>
  );
}

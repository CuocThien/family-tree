import { memo } from 'react';
import { GenerationRow as GenerationRowType } from '@/types/tree-layout';
import { cn } from '@/lib/utils';

interface GenerationRowProps {
  row: GenerationRowType;
  visible: boolean;
}

export const GenerationRow = memo(function GenerationRow({
  row,
  visible,
}: GenerationRowProps) {
  if (!visible) return null;

  const isAlternating = row.level % 2 === 0;

  return (
    <div
      className={cn(
        'absolute left-0 right-0 pointer-events-none transition-colors',
        isAlternating && 'bg-gray-100 dark:bg-gray-800/30'
      )}
      style={{
        top: row.y,
        height: row.height,
      }}
      aria-label={`Generation ${row.level}`}
    >
      {/* Generation Label */}
      {row.labelVisible && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
            {row.label}
          </span>
        </div>
      )}
    </div>
  );
});

GenerationRow.displayName = 'GenerationRow';

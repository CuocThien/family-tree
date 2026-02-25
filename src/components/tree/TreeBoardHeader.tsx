'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from 'next-auth/react';
import { formatDateDistance } from '@/lib/date-utils';
import type { ITree } from '@/types/tree';
import { SearchBar } from './SearchBar';
import { useTreeBoardStore, ViewMode } from '@/store/treeBoardStore';
import { cn } from '@/lib/utils';

const VIEW_MODES: { label: string; value: ViewMode }[] = [
  { label: 'Pedigree View', value: 'pedigree' },
  { label: 'Fan Chart', value: 'fan' },
];

interface TreeBoardHeaderProps {
  tree: ITree;
}

export function TreeBoardHeader({ tree }: TreeBoardHeaderProps) {
  const { data: session } = useSession();
  const { viewMode, setViewMode } = useTreeBoardStore();

  return (
    <header className="z-30 flex items-center justify-between whitespace-nowrap border-b border-border bg-surface/80 dark:bg-surface/80 backdrop-blur-md px-6 py-3">
      <div className="flex items-center gap-8">
        {/* Tree Info */}
        <div className="flex items-center gap-3 text-foreground">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <MaterialSymbol icon="account_tree" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight tracking-tight">{tree.name}</h2>
            <p className="text-xs text-secondary font-medium">
              Last updated {formatDateDistance(tree.updatedAt)}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* View Mode Toggle - Segmented Buttons */}
        <div className="flex h-10 w-64 items-center justify-center rounded-xl bg-surface-elevated p-1">
          {VIEW_MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium transition-all',
                viewMode === mode.value
                  ? 'bg-surface shadow-sm text-primary'
                  : 'text-secondary hover:text-primary'
              )}
            >
              <span className="truncate">{mode.label}</span>
              <input
                type="radio"
                name="view-toggle-header"
                checked={viewMode === mode.value}
                onChange={() => setViewMode(mode.value)}
                className="hidden"
              />
            </label>
          ))}
        </div>

        <div className="h-8 w-px bg-border dark:bg-border" />

        {/* Share Button */}
        <button
          className="flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary size-10 transition-colors"
          aria-label="Share tree"
        >
          <MaterialSymbol icon="share" />
        </button>

        {/* User Avatar */}
        {session?.user && (
          <Avatar
            src={session.user.image}
            alt={session.user.name || 'User'}
            size="md"
            className="border-2 border-primary"
          />
        )}
      </div>
    </header>
  );
}

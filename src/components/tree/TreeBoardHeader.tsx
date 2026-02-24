'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from 'next-auth/react';
import { formatDateDistance } from '@/lib/date-utils';
import type { ITree } from '@/types/tree';
import { SearchBar } from './SearchBar';

type LayoutMode = 'modern' | 'traditional';

interface TreeBoardHeaderProps {
  tree: ITree;
  layoutMode?: LayoutMode;
  onLayoutModeChange?: (mode: LayoutMode) => void;
}

export function TreeBoardHeader({
  tree,
  layoutMode = 'modern',
  onLayoutModeChange
}: TreeBoardHeaderProps) {
  const { data: session } = useSession();

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

        {/* Layout Mode Toggle */}
        {onLayoutModeChange && (
          <div className="flex items-center gap-2 bg-surface-elevated rounded-lg p-1 border border-border">
            <button
              onClick={() => onLayoutModeChange('modern')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                layoutMode === 'modern'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              Modern
            </button>
            <button
              onClick={() => onLayoutModeChange('traditional')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                layoutMode === 'traditional'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              Traditional
            </button>
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
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

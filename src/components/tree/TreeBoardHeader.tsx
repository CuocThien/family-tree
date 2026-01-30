'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from 'next-auth/react';
import { formatDateDistance } from '@/lib/date-utils';
import type { ITree } from '@/types/tree';
import { SearchBar } from './SearchBar';

interface TreeBoardHeaderProps {
  tree: ITree;
}

export function TreeBoardHeader({ tree }: TreeBoardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="z-30 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7f1f3] dark:border-[#1e2f32] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-3">
      <div className="flex items-center gap-8">
        {/* Tree Info */}
        <div className="flex items-center gap-3 text-[#0d191b] dark:text-white">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <MaterialSymbol icon="account_tree" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight tracking-tight">{tree.name}</h2>
            <p className="text-xs text-[#4c8d9a] font-medium">
              Last updated {formatDateDistance(tree.updatedAt)}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        {/* <ViewModeToggle /> - Will add in next task */}

        <div className="h-8 w-px bg-[#e7f1f3] dark:border-[#1e2f32]" />

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

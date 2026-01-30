'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { TreeGrid } from '@/components/dashboard';
import { DashboardNavbar, MobileBottomNav } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { TreeCard } from '@/components/tree/TreeCard';
import type { ITree } from '@/types/tree';

interface TreesContentProps {
  userId: string;
  userName?: string | null;
}

export function TreesContent({ userId, userName }: TreesContentProps) {
  const router = useRouter();

  const { data: trees = [], isLoading, isError, error } = useQuery({
    queryKey: ['trees', userId],
    queryFn: () => fetch('/api/trees').then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch trees');
      }
      return res.json().then((response) => response.data);
    }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <DashboardNavbar userName={userName || undefined} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <DashboardNavbar userName={userName || undefined} />
        <main className="flex-1 px-4 md:px-10 lg:px-40 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-red-500 mb-4">{error?.message || 'Failed to load trees'}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </main>
      </div>
    );
  }

  const totalMembers = trees.reduce(
    (sum: number, tree: any) => sum + (tree.memberCount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardNavbar userName={userName || undefined} />

      <main className="px-4 md:px-10 lg:px-40 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="flex items-center justify-center size-10 rounded-xl hover:bg-[#e7f1f3] dark:hover:bg-[#1e2f32] transition-colors text-[#4c8d9a]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-[#0d191b] dark:text-white tracking-tight">
              My Family Trees
            </h1>
            <p className="text-base text-[#4c8d9a] mt-1">
              {trees.length === 0
                ? 'Create your first family tree to get started'
                : `You have ${trees.length} ${trees.length === 1 ? 'family tree' : 'family trees'} with ${totalMembers.toLocaleString()} ${totalMembers === 1 ? 'member' : 'members'}`
              }
            </p>
          </div>
          <Button
            onClick={() => router.push('/trees/new')}
            leftIcon={<Plus size={18} />}
            className="bg-primary text-white shadow-lg shadow-primary/25"
          >
            Create New Tree
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-[#152528] rounded-xl p-6 border border-[#e7f1f3] dark:border-[#2a3a3d]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MaterialSymbol icon="account_tree" className="text-primary text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d191b] dark:text-white">
                  {trees.length}
                </p>
                <p className="text-sm text-[#4c8d9a]">Family Trees</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#152528] rounded-xl p-6 border border-[#e7f1f3] dark:border-[#2a3a3d]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MaterialSymbol icon="people" className="text-primary text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d191b] dark:text-white">
                  {totalMembers}
                </p>
                <p className="text-sm text-[#4c8d9a]">Total People</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#152528] rounded-xl p-6 border border-[#e7f1f3] dark:border-[#2a3a3d]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MaterialSymbol icon="star" className="text-primary text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d191b] dark:text-white">
                  {trees.filter((t: any) => t.isMain).length}
                </p>
                <p className="text-sm text-[#4c8d9a]">Main Trees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trees Grid */}
        {trees.length === 0 ? (
          <div className="bg-white dark:bg-[#152528] rounded-2xl p-12 border border-[#e7f1f3] dark:border-[#2a3a3d] text-center">
            <div className="size-20 rounded-full bg-[#e7f1f3] dark:bg-[#2a3a3d] flex items-center justify-center mx-auto mb-6">
              <MaterialSymbol icon="account_tree" className="text-4xl text-[#4c8d9a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0d191b] dark:text-white mb-3">
              No family trees yet
            </h2>
            <p className="text-[#4c8d9a] mb-8 max-w-md mx-auto">
              Create your first family tree to start documenting your family heritage and connecting with your roots.
            </p>
            <Button
              onClick={() => router.push('/trees/new')}
              leftIcon={<Plus size={18} />}
              className="bg-primary text-white shadow-lg shadow-primary/25"
              size="lg"
            >
              Create Your First Tree
            </Button>
          </div>
        ) : (
          <TreeGrid
            trees={trees.map((tree: any) => ({
              ...tree,
              lastUpdated: new Date(tree.updatedAt),
            }))}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

TreesContent.displayName = 'TreesContent';

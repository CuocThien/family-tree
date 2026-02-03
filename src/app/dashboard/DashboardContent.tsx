'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { TreeGrid } from '@/components/dashboard';
import { InvitationsWidget } from '@/components/dashboard';
import { ActivityTimeline } from '@/components/dashboard';
import { DNAInsightsBanner } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/dashboard';
import { DashboardNavbar, MobileBottomNav } from '@/components/dashboard';
import { CreateTreeModal } from '@/components/dashboard/CreateTreeModal';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { useCreateTree } from '@/hooks/useCreateTree';
import { useToast } from '@/hooks/useToast';
import type { TreeFormInput } from '@/schemas/tree';

interface DashboardContentProps {
  userId: string;
  userName?: string | null;
}

interface TreeWithStats {
  id: string;
  name: string;
  memberCount: number;
  relationshipCount: number;
  mediaCount: number;
  generations: number;
  coverImage?: string;
  isMain?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Invitation {
  id: string;
  treeId: string;
  treeName: string;
  invitedBy: string;
  createdAt: Date | string;
  expiresAt?: Date | string;
}

interface Activity {
  id: string;
  action: string;
  timestamp: Date | string;
}

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { createTree } = useCreateTree();
  const { toasts, removeToast } = useToast();

  const { data: dashboard, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => fetch('/api/dashboard').then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return res.json();
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
            <p className="text-red-500 mb-4">{error?.message || 'Failed to load dashboard'}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <DashboardNavbar userName={userName || undefined} />
        <DashboardSkeleton />
      </div>
    );
  }

  const trees = dashboard.trees || [];
  const totalMembers = trees.reduce(
    (sum: number, tree: TreeWithStats) => sum + (tree.memberCount || 0),
    0
  );

  const firstName = userName?.split(' ')[0] || 'there';

  const handleCreateTree = async (data: TreeFormInput) => {
    const result = await createTree.mutateAsync(data);
    if (result.success) {
      router.push(`/dashboard/trees/${result.data?._id}`);
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardNavbar userName={userName || undefined} />

      <main className="px-4 md:px-10 lg:px-40 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Page Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-[#0d191b] dark:text-white tracking-tight">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-base text-[#4c8d9a] mt-1">
                  You have {totalMembers.toLocaleString()} {totalMembers === 1 ? 'member' : 'members'} across {trees.length} {trees.length === 1 ? 'family tree' : 'family trees'}.
                </p>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus size={18} />}
                className="bg-primary text-white shadow-lg shadow-primary/25"
              >
                Create New Tree
              </Button>
            </div>

            {/* Tree Grid */}
            <section className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-[#e7f1f3] dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-bold text-[#0d191b] dark:text-white">
                  My Family Trees
                </h2>
                {trees.length > 3 && (
                  <button
                    onClick={() => router.push('/dashboard/trees')}
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              <TreeGrid
                trees={trees.map((tree: TreeWithStats) => ({
                  ...tree,
                  lastUpdated: new Date(tree.updatedAt),
                }))}
                limit={3}
              />
            </section>

            {/* DNA Banner */}
            {dashboard.dnaMatches > 0 && (
              <DNAInsightsBanner matchCount={dashboard.dnaMatches} />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <InvitationsWidget
              invitations={(dashboard.invitations || []).map((inv: Invitation) => ({
                ...inv,
                createdAt: new Date(inv.createdAt),
                expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
              }))}
            />
            <ActivityTimeline
              activities={(dashboard.recentActivity || []).map((activity: Activity) => ({
                ...activity,
                timestamp: new Date(activity.timestamp),
              }))}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Create Tree Modal */}
      <CreateTreeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTree}
      />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

DashboardContent.displayName = 'DashboardContent';

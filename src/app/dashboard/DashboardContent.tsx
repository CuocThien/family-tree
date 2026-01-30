'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Home, Search, User } from 'lucide-react';
import { TreeGrid } from '@/components/dashboard';
import { InvitationsWidget } from '@/components/dashboard';
import { ActivityTimeline } from '@/components/dashboard';
import { DNAInsightsBanner } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/dashboard';
import { DashboardNavbar } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface DashboardContentProps {
  userId: string;
  userName?: string | null;
}

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const router = useRouter();

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

  const totalMembers = dashboard.trees.reduce(
    (sum: number, tree: any) => sum + (tree.memberCount || 0),
    0
  );

  const firstName = userName?.split(' ')[0] || 'there';

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
                  You have {totalMembers.toLocaleString()} {totalMembers === 1 ? 'member' : 'members'} across {dashboard.trees.length} {dashboard.trees.length === 1 ? 'family tree' : 'family trees'}.
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

            {/* Tree Grid */}
            <section className="bg-white dark:bg-white/5 rounded-2xl p-6 shadow-sm border border-[#e7f1f3] dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-bold text-[#0d191b] dark:text-white">
                  My Family Trees
                </h2>
                {dashboard.trees.length > 3 && (
                  <button
                    onClick={() => router.push('/dashboard/trees')}
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              <TreeGrid
                trees={dashboard.trees.map((tree: any) => ({
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
              invitations={(dashboard.invitations || []).map((inv: any) => ({
                ...inv,
                createdAt: new Date(inv.createdAt),
                expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
              }))}
            />
            <ActivityTimeline
              activities={(dashboard.recentActivity || []).map((activity: any) => ({
                ...activity,
                timestamp: new Date(activity.timestamp),
              }))}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-[#e7f1f3] dark:border-white/10 px-4 py-2 flex justify-around items-center z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/dashboard/trees" className="flex flex-col items-center gap-1 text-[#4c8d9a]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L12 12M12 12L8 16M12 12L16 16M12 12L5 22M12 12L19 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] font-medium">Trees</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-[#4c8d9a]">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-[#4c8d9a]">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}

DashboardContent.displayName = 'DashboardContent';

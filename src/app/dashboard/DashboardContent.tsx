'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Home, Search, User, ArrowRight } from 'lucide-react';
import { TreeGrid } from '@/components/dashboard';
import { InvitationsWidget } from '@/components/dashboard';
import { ActivityTimeline } from '@/components/dashboard';
import { DNAInsightsBanner } from '@/components/dashboard';
import { DashboardSkeleton } from '@/components/dashboard';
import { DashboardNavbar } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { cn } from '@/lib/utils';
import { memo, useCallback } from 'react';

interface DashboardContentProps {
  userId: string;
  userName?: string | null;
}

// Memoized components for performance
const QuickStatCard = memo(function QuickStatCard({
  icon,
  label,
  value,
  color = 'primary',
}: {
  icon: string;
  label: string;
  value: number | string;
  color?: 'primary' | 'secondary' | 'accent';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-blue-500/10 text-blue-500',
    accent: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-white dark:bg-[#152528] rounded-xl p-5 border border-[#e7f1f3] dark:border-[#2a3a3d] hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={cn('size-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
          <MaterialSymbol icon={icon} className="text-xl" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0d191b] dark:text-white tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm text-[#4c8d9a]">{label}</p>
        </div>
      </div>
    </div>
  );
});

const EmptyTreesState = memo(function EmptyTreesState({ onCreateTree }: { onCreateTree: () => void }) {
  return (
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
        onClick={onCreateTree}
        leftIcon={<Plus size={18} />}
        className="bg-primary text-white shadow-lg shadow-primary/25"
        size="lg"
      >
        Create Your First Tree
      </Button>
    </div>
  );
});

const WelcomeSection = memo(function WelcomeSection({
  firstName,
  onCreateTree,
}: {
  firstName: string;
  onCreateTree: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-[#0d191b] dark:text-white tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="text-base text-[#4c8d9a] mt-1">
          Here's what's happening with your family trees
        </p>
      </div>
      <Button
        onClick={onCreateTree}
        leftIcon={<Plus size={18} />}
        className="bg-primary text-white shadow-lg shadow-primary/25 whitespace-nowrap"
      >
        Create New Tree
      </Button>
    </div>
  );
});

const TreeSectionHeader = memo(function TreeSectionHeader({
  treesCount,
  onViewAll,
}: {
  treesCount: number;
  onViewAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[22px] font-bold text-[#0d191b] dark:text-white">
        My Family Trees
      </h2>
      {treesCount > 3 && (
        <button
          onClick={onViewAll}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const router = useRouter();

  const { data: dashboard, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => fetch('/api/dashboard').then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return res.json().then((response) => response.data);
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized callbacks to prevent unnecessary re-renders
  const handleCreateTree = useCallback(() => {
    router.push('/trees/new');
  }, [router]);

  const handleViewAllTrees = useCallback(() => {
    router.push('/dashboard/trees');
  }, [router]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

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
            <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <MaterialSymbol icon="error" className="text-3xl text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-[#0d191b] dark:text-white mb-2">
              Failed to load dashboard
            </h2>
            <p className="text-[#4c8d9a] mb-6">{error?.message || 'Something went wrong'}</p>
            <Button onClick={handleRetry}>Try Again</Button>
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
    (sum: number, tree: any) => sum + (tree.memberCount || 0),
    0
  );

  const firstName = userName?.split(' ')[0] || 'there';
  const hasMultipleTrees = trees.length > 3;

  // Format trees data once
  const formattedTrees = trees.map((tree: any) => ({
    ...tree,
    lastUpdated: new Date(tree.updatedAt),
  }));

  // Format invitations data
  const formattedInvitations = (dashboard.invitations || []).map((inv: any) => ({
    ...inv,
    createdAt: new Date(inv.createdAt),
    expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : undefined,
  }));

  // Format activities data
  const formattedActivities = (dashboard.recentActivity || []).map((activity: any) => ({
    ...activity,
    timestamp: new Date(activity.timestamp),
  }));

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <DashboardNavbar userName={userName || undefined} />

      <main className="px-4 md:px-10 lg:px-40 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Welcome Section */}
            <WelcomeSection firstName={firstName} onCreateTree={handleCreateTree} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickStatCard
                icon="account_tree"
                label="Family Trees"
                value={trees.length}
              />
              <QuickStatCard
                icon="people"
                label="Total Members"
                value={totalMembers}
                color="secondary"
              />
              <QuickStatCard
                icon="auto_awesome"
                label="Days Active"
                value={dashboard.daysActive || 0}
                color="accent"
              />
            </div>

            {/* Trees Section */}
            <section className="bg-white dark:bg-[#152528] rounded-2xl p-6 shadow-sm border border-[#e7f1f3] dark:border-[#2a3a3d]">
              <div className="mb-6">
                <TreeSectionHeader treesCount={trees.length} onViewAll={handleViewAllTrees} />
              </div>
              {trees.length === 0 ? (
                <EmptyTreesState onCreateTree={handleCreateTree} />
              ) : (
                <TreeGrid trees={formattedTrees} limit={3} />
              )}
            </section>

            {/* DNA Banner */}
            {(dashboard.dnaMatches || 0) > 0 && (
              <DNAInsightsBanner matchCount={dashboard.dnaMatches || 0} />
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <InvitationsWidget invitations={formattedInvitations} />
            <ActivityTimeline activities={formattedActivities} />
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-[#e7f1f3] dark:border-white/10 px-4 py-2 flex justify-around items-center z-50 safe-area-inset-bottom">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary" aria-label="Home">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/dashboard/trees" className="flex flex-col items-center gap-1 text-[#4c8d9a]" aria-label="Trees">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L12 12M12 12L8 16M12 12L16 16M12 12L5 22M12 12L19 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] font-medium">Trees</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-[#4c8d9a]" aria-label="Search">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 text-[#4c8d9a]" aria-label="Settings">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

DashboardContent.displayName = 'DashboardContent';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function DashboardSkeleton() {
  return (
    <main className="flex-1 px-4 md:px-10 lg:px-40 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Page Heading Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-11 w-36" />
          </div>

          {/* Tree Grid Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-9 w-20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <TreeCardSkeleton />
                <TreeCardSkeleton />
                <TreeCardSkeleton />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <InvitationsWidgetSkeleton />
          <ActivityTimelineSkeleton />
        </aside>
      </div>
    </main>
  );
}

DashboardSkeleton.displayName = 'DashboardSkeleton';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#e7f1f3] dark:bg-white/5', className)}
      {...props}
    />
  );
}

function TreeCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="w-full aspect-video rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

function InvitationsWidgetSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTimelineSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-5" />
        <div className="flex flex-col gap-6">
          <ActivityItemSkeleton />
          <ActivityItemSkeleton />
          <ActivityItemSkeleton />
        </div>
        <Skeleton className="h-11 w-full mt-5" />
      </CardContent>
    </Card>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-full max-w-[200px]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

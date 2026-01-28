import { Skeleton } from '@/components/ui/Skeleton';

export function TreeBoardSkeleton() {
  return (
    <div className="w-full h-full bg-[#f8fafc] dark:bg-[#0f172a] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        {/* Loading spinner */}
        <div className="w-12 h-12 border-4 border-[#13c8ec]/20 border-t-[#13c8ec] rounded-full animate-spin" />

        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-5 w-48 bg-[#e7f1f3]" />
          <Skeleton className="h-4 w-64 bg-[#e7f1f3]/60" />
        </div>

        {/* Mock tree structure */}
        <div className="mt-8 flex flex-col items-center gap-6">
          {/* Root node skeleton */}
          <Skeleton className="w-20 h-20 rounded-full bg-[#e7f1f3]" />

          {/* Connection lines */}
          <div className="w-0.5 h-8 bg-[#e7f1f3]" />

          {/* Parent nodes skeleton */}
          <div className="flex gap-16">
            <Skeleton className="w-16 h-16 rounded-full bg-[#e7f1f3]" />
            <Skeleton className="w-16 h-16 rounded-full bg-[#e7f1f3]" />
          </div>

          {/* Connection lines */}
          <div className="flex gap-16">
            <div className="w-0.5 h-8 bg-[#e7f1f3]" />
            <div className="w-0.5 h-8 bg-[#e7f1f3]" />
          </div>

          {/* Grandparent nodes skeleton */}
          <div className="flex gap-8">
            <Skeleton className="w-12 h-12 rounded-full bg-[#e7f1f3]/60" />
            <Skeleton className="w-12 h-12 rounded-full bg-[#e7f1f3]/60" />
            <Skeleton className="w-12 h-12 rounded-full bg-[#e7f1f3]/60" />
            <Skeleton className="w-12 h-12 rounded-full bg-[#e7f1f3]/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

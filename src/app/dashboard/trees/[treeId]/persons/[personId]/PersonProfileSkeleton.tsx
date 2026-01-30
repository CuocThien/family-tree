import { Skeleton } from '@/components/ui';

export function PersonProfileSkeleton() {
  return (
    <main className="flex-1 py-5 md:py-10">
      <div className="max-w-[1024px] mx-auto px-4 md:px-0">
        {/* Breadcrumbs */}
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-[#e7f1f3] dark:border-gray-800 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Profile Photo */}
            <Skeleton className="size-32 md:size-48 rounded-full" />

            {/* Info */}
            <div className="flex flex-col flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Skeleton className="h-10 w-64 mb-2" />
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-5 w-48" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                  <Skeleton className="h-11 w-28" />
                  <Skeleton className="h-11 w-28" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                <Skeleton className="h-16 w-32 rounded-lg" />
                <Skeleton className="h-16 w-32 rounded-lg" />
                <Skeleton className="h-16 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Skeleton className="h-11 w-24 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-20 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}

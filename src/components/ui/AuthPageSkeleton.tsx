import { Skeleton } from './Skeleton';

export function AuthPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Hero Section Skeleton - Hidden on mobile */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-[#13c8ec] to-[#0d8fa8]">
        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full px-12 text-white">
          {/* Logo Skeleton */}
          <Skeleton className="w-16 h-16 rounded-full bg-white/20 mb-8" />

          {/* Tagline Skeleton */}
          <Skeleton className="h-10 w-80 bg-white/20 mb-4" />
          <Skeleton className="h-6 w-64 bg-white/20" />
        </div>
      </div>

      {/* Form Section Skeleton */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-24 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo Skeleton */}
          <div className="lg:hidden flex justify-center mb-8">
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>

          {/* Heading Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Form Skeleton */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Remember Me Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-28" />
            </div>

            {/* Button Skeleton */}
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* Divider Skeleton */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <Skeleton className="h-4 w-28 bg-white dark:bg-gray-900" />
            </div>
          </div>

          {/* OAuth Buttons Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* Register Link Skeleton */}
          <div className="mt-8 flex justify-center">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

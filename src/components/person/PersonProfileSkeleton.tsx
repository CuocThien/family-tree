export function PersonProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-24 h-24 rounded-full bg-[#e7f1f3] dark:bg-gray-800" />
              <div className="flex flex-col flex-1 text-center md:text-left">
                <div className="h-8 bg-[#e7f1f3] dark:bg-gray-800 rounded w-64 mb-2 mx-auto md:mx-0" />
                <div className="h-4 bg-[#e7f1f3] dark:bg-gray-800 rounded w-48 mb-4 mx-auto md:mx-0" />
                <div className="flex gap-4 justify-center md:justify-start">
                  <div className="h-10 bg-[#e7f1f3] dark:bg-gray-800 rounded w-24" />
                  <div className="h-10 bg-[#e7f1f3] dark:bg-gray-800 rounded w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="flex border-b border-[#e7f1f3] dark:border-gray-800 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-24 mr-8 bg-[#e7f1f3] dark:bg-gray-800 rounded-t" />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 bg-[#e7f1f3] dark:bg-gray-800 rounded-xl" />
              <div className="h-48 bg-[#e7f1f3] dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="h-64 bg-[#e7f1f3] dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

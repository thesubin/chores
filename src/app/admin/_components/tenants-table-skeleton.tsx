"use client";

export function TenantsTableSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Search and filters skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-10 w-64 rounded bg-gray-200"></div>
        <div className="h-10 w-32 rounded bg-gray-200"></div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        {/* Header */}
        <div className="grid grid-cols-5 gap-4 border-b border-gray-200 bg-gray-50 p-4">
          <div className="h-6 w-24 rounded bg-gray-200"></div>
          <div className="h-6 w-24 rounded bg-gray-200"></div>
          <div className="h-6 w-16 rounded bg-gray-200"></div>
          <div className="h-6 w-16 rounded bg-gray-200"></div>
          <div className="h-6 w-16 rounded bg-gray-200"></div>
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 border-b border-gray-200 p-4"
          >
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-gray-200"></div>
              <div className="h-4 w-24 rounded bg-gray-200"></div>
            </div>
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-gray-200"></div>
              <div className="h-4 w-24 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 w-16 rounded bg-gray-200"></div>
            <div className="h-6 w-16 rounded bg-gray-200"></div>
            <div className="flex justify-end space-x-2">
              <div className="h-8 w-8 rounded bg-gray-200"></div>
              <div className="h-8 w-8 rounded bg-gray-200"></div>
              <div className="h-8 w-8 rounded bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-gray-200"></div>
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

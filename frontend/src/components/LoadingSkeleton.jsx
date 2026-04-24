export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="flex-1" />
        <div className="h-8 bg-gray-200 rounded w-32" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <div className="h-4 w-4 bg-gray-200 rounded" />
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="flex-1">
                <div className={`h-4 bg-gray-200 rounded ${j === 0 ? 'w-3/4' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-gray-200 flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-20" />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-gray-200 rounded-xl" />
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid sm:grid-cols-3 gap-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="sm:col-span-2 h-4 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

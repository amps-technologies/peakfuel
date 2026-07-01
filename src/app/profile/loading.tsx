// app/profile/loading.tsx
export default function ProfileLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
      {/* Avatar + name */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-sky-100 rounded-full animate-pulse shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Delivery info skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="h-2.5 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-4 h-4 bg-gray-100 rounded animate-pulse shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-50">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-4 h-4 bg-gray-100 rounded animate-pulse shrink-0" />
              <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Sign out button skeleton */}
      <div className="h-11 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}

// app/track/loading.tsx
import { MapPin } from "lucide-react";

export default function TrackLoading() {
  return (
    <div className="max-w-lg h-screen mx-auto px-4 py-8 space-y-5">
      {/* Header (static, matches real page instantly) */}
      <div className="text-center">
        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin size={22} className="text-sky-500" />
        </div>
        <h1 className="text-xl font-bold">Track your orders</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select an order below or enter your order ID
        </p>
      </div>

      {/* Filters skeleton */}
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse shrink-0" />
        <div className="h-10 flex-1 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* Order card skeletons — shaped like the real cards, no layout jump */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="w-full bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 bg-gray-100 rounded-lg shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-2.5 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

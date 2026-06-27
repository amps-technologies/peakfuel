export default function ProductDetailLoading() {
  return (
    /* 
      Matches the main structural container's height configurations exactly,
      ensuring the loading shimmering phase remains locked to a single screen frame.
    */
    <div className="max-w-5xl mx-auto px-4 md:py-8 py-3 h-[calc(100vh-14)] md:h-auto flex flex-col overflow-hidden pb-4 md:pb-0 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 bg-gray-100 rounded w-24 mb-3 md:mb-6 shrink-0" />

      {/* Main layout skeleton card - maps onto the grid grid-cols-1 md:grid-cols-[auto_1fr] blueprint */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] bg-white border border-gray-100 rounded-2xl overflow-hidden flex-1 md:flex-initial min-h-0">
        {/* Left Column: Image Skeleton area (Matches clean v4 heights min-h-45 max-h-65) */}
        <div className="w-full md:w-80 lg:w-96 min-h-45 max-h-65 md:max-h-none md:h-full bg-sky-50/50 shrink-0 relative" />

        {/* Right Column: Information Panel Skeleton view */}
        <div className="flex flex-col justify-between p-5 md:p-6 min-h-0 overflow-hidden">
          {/* Main content body blocks */}
          <div className="space-y-4 flex-1 min-h-0 overflow-hidden">
            {/* Category badge skeleton */}
            <div className="h-5 bg-gray-100 rounded-full w-20" />

            {/* Title text line placeholder */}
            <div className="h-6 bg-gray-100 rounded w-3/4" />

            {/* Price section layout tracking element */}
            <div className="h-7 bg-gray-100 rounded w-1/3 mt-2" />

            {/* Description mockup block */}
            <div className="space-y-2 pt-1 max-h-25 md:max-h-none overflow-hidden">
              <div className="h-3.5 bg-gray-100 rounded w-full" />
              <div className="h-3.5 bg-gray-100 rounded w-11/12" />
              <div className="h-3.5 bg-gray-100 rounded w-4/5 hidden md:block" />
            </div>

            {/* Stock tracker node */}
            <div className="h-4 bg-gray-100 rounded w-24 pt-1" />
          </div>

          {/* Action trigger button skeleton */}
          <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
            <div className="h-12 bg-gray-100 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

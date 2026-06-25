// app/products/[id]/loading.tsx
export default function ProductDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:py-8 py-4 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 bg-gray-200 rounded w-24 mb-4 sm:mb-6" />

      {/* Main container skeleton */}
      <div className="flex flex-col md:flex-row gap-8 bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Left column: Image Skeleton */}
        <div className="w-full md:w-80 lg:w-96 shrink-0">
          <div className="aspect-square bg-gray-100 w-full" />
        </div>

        {/* Right column: Details Skeleton */}
        <div className="flex flex-col justify-between py-2 px-6 sm:py-6 flex-1 min-w-0 space-y-4">
          <div className="space-y-4">
            {/* Category badge */}
            <div className="h-5 bg-gray-200 rounded-full w-20" />

            {/* Title */}
            <div className="h-7 bg-gray-200 rounded w-3/4" />

            {/* Price */}
            <div className="h-8 bg-gray-200 rounded w-1/3 mt-2" />

            {/* Description lines */}
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>

            {/* Stock indicator */}
            <div className="h-4 bg-gray-200 rounded w-24 mt-4" />
          </div>

          {/* Button placeholder at the bottom */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="h-11 bg-gray-200 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

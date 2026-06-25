// app/(store)/products/[id]/loading.tsx
export default function ProductDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Back Button Skeleton */}
      <div className="h-4 bg-gray-200 rounded w-20 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Image Skeleton */}
        <div className="aspect-square bg-gray-100 rounded-2xl w-full" />

        {/* Right column: Content Skeleton */}
        <div className="space-y-4 py-2">
          {/* Title skeleton */}
          <div className="h-7 bg-gray-200 rounded w-3/4" />

          {/* Unit tag skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/4" />

          {/* Price skeleton */}
          <div className="h-8 bg-gray-200 rounded w-1/3 mt-6" />

          {/* Divider */}
          <div className="h-px bg-gray-100 my-6" />

          {/* Description paragraphs */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>

          {/* Add to Cart button skeleton */}
          <div className="h-11 bg-gray-200 rounded-xl w-full mt-8" />
        </div>
      </div>
    </div>
  );
}

"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Force Next.js to compile this chunk purely inside the browser layout context
const DynamicShopContent = dynamic(
  () => import("../../components/ShopContent"),
  {
    ssr: false,
    loading: () => <ShopSkeletonFallback />, // Changed 'fallback' to 'loading' to fix the TS error
  },
);

function ShopSkeletonFallback() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="h-40 bg-gray-100 rounded-2xl animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeletonFallback />}>
      <DynamicShopContent />
    </Suspense>
  );
}

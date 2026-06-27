import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return (
    /* 
      - h-[calc(100vh-14)] subtracts the 56px navbar cleanly using standard v4 spacing units.
      - pb-4 ensures full clearance for modern mobile screen notch overlays.
    */
    <div className="max-w-5xl mx-auto px-4 md:py-8 py-3 h-[calc(100vh-14)] md:h-auto flex flex-col overflow-hidden pb-4 md:pb-0">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-sky-500 mb-3 md:mb-6 cursor-pointer transition-colors shrink-0"
      >
        <ArrowLeft size={15} /> Back to shop
      </Link>

      {/* 
        Main Layout Container Card
        - Swapped to a strict Tailwind Grid setup to guarantee perfect column scaling.
        - On desktop, columns align dynamically: Left maps to width specs, Right maps to remaining space.
      */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] bg-white border border-gray-100 rounded-2xl overflow-hidden flex-1 md:flex-initial min-h-0">
        {/* Left Column: Image Container
            - Cleaned up to Tailwind v4 numeric utility aliases to satisfy the compiler linter.
            - md:h-full ensures the sky-50 background expands completely on desktop monitors.
        */}
        <div className="w-full md:w-80 lg:w-96 min-h-45 max-h-65 md:max-h-none md:h-full relative bg-sky-50">
          <div className="absolute inset-0">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-4 md:p-6"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Image
                  src="/logo.png"
                  alt="placeholder"
                  width={64}
                  height={64}
                  className="opacity-20 object-contain"
                />
                <span className="text-xs text-gray-300">No image yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information Panel
            - flex-1 and min-h-0 isolate this column's vertical track layout dynamically.
        */}
        <div className="flex flex-col justify-between p-5 md:p-6 min-h-0 overflow-hidden">
          {/* Scrollable description box prevents vertical container leaks */}
          <div className="space-y-3 overflow-y-auto pr-1 min-h-0 flex-1">
            {/* Category badge */}
            <span className="inline-block text-xs font-medium px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full capitalize">
              {product.category}
            </span>

            {/* Name */}
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-3xl font-bold text-sky-600">
                ₱{product.price.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-gray-400">
                / {product.unit}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-h-25 md:max-h-none overflow-y-auto scrollbar-thin">
                {product.description}
              </p>
            )}

            {/* Stock status */}
            <div className="flex items-center gap-2 pt-1">
              <div
                className={`w-2 h-2 rounded-full ${product.in_stock ? "bg-green-500" : "bg-red-400"}`}
              />
              <span
                className={`text-xs sm:text-sm font-medium ${product.in_stock ? "text-green-600" : "text-red-500"}`}
              >
                {product.in_stock ? "In stock" : "Out of stock"}
              </span>
            </div>
          </div>

          {/* Add to cart action area */}
          <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

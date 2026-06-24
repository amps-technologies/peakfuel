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

  // const categoryEmoji: Record<string, string> = {
  //   tank: "🛢️",
  //   refill: "🔄",
  //   regulator: "🔧",
  //   accessory: "🔩",
  //   safety: "🧯",
  // };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:py-8 py-4">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-sky-500 mb-4 sm:mb-6 cursor-pointer transition-colors"
      >
        <ArrowLeft size={15} /> Back to shop
      </Link>

      {/* 
        Side-by-side on desktop — image left, details right
        Stacked on mobile — image top, details below
      */}
      <div className="flex flex-col md:flex-row gap-8 bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Image — constrained on desktop so details are always visible */}
        <div className="w-full md:w-80 lg:w-96 shrink-0">
          <div className="relative w-full aspect-square bg-sky-50">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Image
                  src="/logo.png"
                  alt="placeholder"
                  width={80}
                  height={80}
                  className="opacity-20 object-contain"
                />
                <span className="text-xs text-gray-300">No image yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Details — always fully visible alongside image on desktop */}
        <div className="flex flex-col justify-between py-2 px-6 sm:py-6 flex-1 min-w-0">
          <div className="space-y-4">
            {/* Category badge */}
            <span className="inline-block text-xs font-medium px-2.5 py-1 bg-sky-50 text-sky-600 rounded-full capitalize">
              {product.category}
            </span>

            {/* Name */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-sky-600">
                ₱{product.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400">/ {product.unit}</span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${product.in_stock ? "bg-green-500" : "bg-red-400"}`}
              />
              <span
                className={`text-sm font-medium ${product.in_stock ? "text-green-600" : "text-red-500"}`}
              >
                {product.in_stock ? "In stock" : "Out of stock"}
              </span>
            </div>
          </div>

          {/* Add to cart — pinned to bottom of details column */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

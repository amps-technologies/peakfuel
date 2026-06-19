"use client";
import { Suspense } from "react";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Flame, Truck, Shield } from "lucide-react";
import type { Product } from "@/types";
import Image from "next/image";

const catMap: Record<string, string> = {
  tanks: "tank",
  refills: "refill",
  regulators: "regulator",
  accessories: "accessory",
  safety: "safety",
};

// Two versions — desktop shows emoji, mobile is text-only and compact
const categoryPills = [
  { label: "🛢️ Tanks", short: "Tanks", value: "tanks" },
  { label: "🔄 Refills", short: "Refills", value: "refills" },
  { label: "🔧 Regulators", short: "Regulators", value: "regulators" },
  { label: "🔩 Accessories", short: "Accessories", value: "accessories" },
  { label: "🧯 Safety", short: "Safety", value: "safety" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      setFadeIn(false);

      let query = supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at");

      if (category && category !== "all") {
        const dbCat = catMap[category] ?? category;
        query = query.eq("category", dbCat);
      }

      const { data } = await query;
      setAllProducts((data as Product[]) ?? []);
      setLoading(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFadeIn(true));
      });
    };

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const products = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [allProducts, searchQuery]);

  const switchCategory = (value: string) => {
    if (value === category) return;
    const params = new URLSearchParams();
    if (value) params.set("category", value);
    if (searchQuery) params.set("q", searchQuery);
    const url = params.toString() ? `/?${params.toString()}` : "/";
    router.push(url, { scroll: false });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-6 mb-6 text-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Fast LPG Delivery</h1>
          <p className="text-sky-100 text-sm mb-4">
            Cylinders, refills and accessories. Same-day delivery available.
          </p>
          <div className="flex gap-4 text-xs text-sky-100">
            <span className="flex items-center gap-1">
              <Truck size={13} /> Same-day delivery
            </span>
            <span className="flex items-center gap-1">
              <Shield size={13} /> Safety certified
            </span>
            <span className="flex items-center gap-1">
              <Flame size={13} /> 22 products
            </span>
          </div>
        </div>
        <Image src="/logo.png" alt="logo" height={80} width={80} />
      </div>

      {/* Category pills — sticky below navbar */}
      <div className="sticky top-14 z-40 bg-gray-50 -mx-4 px-4 py-2 mb-2">
        {/* Fade hint on right edge — hints there are more pills to scroll */}
        <div className="relative">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {/* All pill */}
            <button
              onClick={() => switchCategory("")}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 font-medium
          ${
            category === ""
              ? "bg-sky-500 text-white border-sky-500"
              : "bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-500"
          }`}
            >
              All
            </button>

            {categoryPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => switchCategory(pill.value)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0
            ${
              category === pill.value
                ? "bg-sky-500 text-white border-sky-500 font-medium"
                : "bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-500"
            }`}
              >
                {/* Show short label (no emoji) on mobile, full label with emoji on sm+ */}
                <span className="sm:hidden">{pill.short}</span>
                <span className="hidden sm:inline">{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Right fade — signals more content to scroll horizontally */}
          <div className="absolute right-0 top-0 bottom-0.5 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none sm:hidden" />
        </div>
      </div>

      {/* Search result info */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <span>
            {products.length} result{products.length !== 1 ? "s" : ""} for
            <strong className="text-gray-800 ml-1">
              &quot;{searchQuery}&quot;
            </strong>
          </span>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (category) params.set("category", category);
              const url = params.toString() ? `/?${params.toString()}` : "/";
              router.push(url, { scroll: false });
            }}
            className="ml-1 text-sky-500 hover:text-sky-600 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Product grid */}
      <div
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 250ms ease-out, transform 250ms ease-out",
        }}
      >
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-28 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-7 bg-gray-100 rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p>
              {searchQuery
                ? `No products found for "${searchQuery}"`
                : "No products found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

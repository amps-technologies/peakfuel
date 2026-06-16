"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Flame, Truck, Shield, Search, X } from "lucide-react";
import type { Product } from "@/types";

const catMap: Record<string, string> = {
  tanks: "tank",
  refills: "refill",
  regulators: "regulator",
  accessories: "accessory",
  safety: "safety",
};

const categoryPills = [
  { label: "All", value: "" },
  { label: "🛢️ Tanks", value: "tanks" },
  { label: "🔄 Refills", value: "refills" },
  { label: "🔧 Regulators", value: "regulators" },
  { label: "🔩 Accessories", value: "accessories" },
  { label: "🧯 Safety", value: "safety" },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);

  const supabase = createClient();

  // Fetch whenever category changes — search filters client-side
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

  // Filter by search query client-side
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
      <div className="bg-linear-to-r from-sky-500 to-sky-600 rounded-2xl p-6 mb-6 text-white flex items-center justify-between">
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
        <div className="text-8xl opacity-20 select-none">🛢️</div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categoryPills.map((pill) => (
          <button
            key={pill.value}
            onClick={() => switchCategory(pill.value)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all duration-200 cursor-pointer
              ${
                category === pill.value
                  ? "bg-sky-500 text-white border-sky-500 scale-105"
                  : "bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-500"
              }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Search result info */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Search size={14} />
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
            className="ml-1 text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
          >
            <X size={13} /> Clear
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

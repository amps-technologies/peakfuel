"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Flame, Truck, Shield, ChevronRight, ChevronDown } from "lucide-react";
import type { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";

const catMap: Record<string, string> = {
  tanks: "tank",
  refills: "refill",
  regulators: "regulator",
  accessories: "accessory",
  safety: "safety",
};

const CATEGORY_LABELS: Record<string, string> = {
  tank: "Tanks",
  refill: "Refills",
  regulator: "Regulators",
  accessory: "Accessories",
  safety: "Safety",
};

const CATEGORY_ORDER = ["tank", "refill", "regulator", "accessory", "safety"];
const DESKTOP_PREVIEW = 5;
const MOBILE_PREVIEW = 4;

const categoryPills = [
  { label: "All", short: "All", value: "" },
  { label: "🛢️ Tanks", short: "Tanks", value: "tanks" },
  { label: "🔄 Refills", short: "Refills", value: "refills" },
  { label: "🔧 Regulators", short: "Regulators", value: "regulators" },
  { label: "🔩 Accessories", short: "Accessories", value: "accessories" },
  { label: "🧯 Safety", short: "Safety", value: "safety" },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

interface CategorySectionProps {
  cat: string;
  products: Product[];
}

function CategorySection({ cat, products }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const isDesktop = useIsDesktop();
  const previewCount = isDesktop ? DESKTOP_PREVIEW : MOBILE_PREVIEW;
  const hasMore = products.length > previewCount;
  const visible = expanded ? products : products.slice(0, previewCount);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
          {CATEGORY_LABELS[cat] ?? cat}
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronDown size={14} />
                Show less
              </>
            ) : (
              <>
                <ChevronRight size={14} />
                {products.length - previewCount} more
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-sky-500 border border-dashed border-gray-200 hover:border-sky-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          {expanded ? (
            <>
              <ChevronDown size={13} />
              Show less
            </>
          ) : (
            <>
              <ChevronRight size={13} />
              Show all {products.length} {CATEGORY_LABELS[cat]?.toLowerCase()}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function ShopContent() {
  const [filters, setFilters] = useState<{
    category: string;
    searchQuery: string;
  }>({
    category: "",
    searchQuery: "",
  });

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  const { category, searchQuery } = filters;

  useEffect(() => {
    const syncUrlFilters = () => {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        category: params.get("category") ?? "",
        searchQuery: params.get("q") ?? "",
      });
    };

    // Run once safely on mount to capture cold starting parameters
    const timer = setTimeout(syncUrlFilters, 0);

    // Listen to high-speed typing updates dispatched from the navbar search box
    window.addEventListener("gasgo-search-sync", syncUrlFilters);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("gasgo-search-sync", syncUrlFilters);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("in_stock", true)
          .order("category", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        if (error)
          console.error("Supabase Database Fetch Error:", error.message);
        setAllProducts((data as Product[]) ?? []);
      } catch (err) {
        console.error("Critical Network Connection Interrupted:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const products = useMemo(() => {
    let list = allProducts;
    if (category && category !== "all") {
      const dbCat = catMap[category] ?? category;
      list = list.filter((p) => p.category === dbCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allProducts, category, searchQuery]);

  const grouped = useMemo(() => {
    const showingAll = !category && !searchQuery.trim();
    if (!showingAll) return null;

    const map: Record<string, Product[]> = {};
    products.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });

    return CATEGORY_ORDER.filter((cat) => (map[cat]?.length ?? 0) > 0).map(
      (cat) => ({ category: cat, products: map[cat] }),
    );
  }, [products, category, searchQuery]);

  const switchCategory = (value: string) => {
    if (value === category) return;
    setIsChanging(true);
    setTimeout(() => {
      setFilters((prev) => ({ ...prev, category: value }));
      const params = new URLSearchParams();
      if (value) params.set("category", value);
      if (searchQuery) params.set("q", searchQuery);
      const newUrl = params.toString() ? `/?${params.toString()}` : "/";
      window.history.replaceState(null, "", newUrl);
      setIsChanging(false);
    }, 120);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero Header */}
      <div className="bg-linear-to-r from-sky-500 to-sky-600 rounded-2xl p-6 mb-6 text-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Fast LPG Delivery</h1>
          <p className="text-sky-100 text-sm mb-4">
            Cylinders, refills and accessories. Same-day delivery available.
          </p>
          <div className="flex gap-4 text-xs text-sky-100 flex-wrap">
            <span className="flex items-center gap-1">
              <Truck size={13} /> Same-day delivery
            </span>
            <span className="flex items-center gap-1">
              <Shield size={13} /> Safety certified
            </span>
            <span className="flex items-center gap-1">
              <Flame size={13} />
              {category
                ? `${products.length} product${products.length !== 1 ? "s" : ""}`
                : `${allProducts.length} products`}
            </span>
          </div>
        </div>
        <Image
          src="/logo.png"
          alt="logo"
          height={80}
          width={80}
          className="shrink-0"
        />
      </div>

      {/* Navigation Pills */}
      <div className="sticky top-14 z-40 bg-gray-50 -mx-4 px-4 py-2 mb-4">
        <div className="relative">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {categoryPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => switchCategory(pill.value)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 font-medium
                  ${
                    category === pill.value
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-500"
                  }`}
              >
                <span className="sm:hidden">{pill.short}</span>
                <span className="hidden sm:inline">{pill.label}</span>
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0.5 w-8 bg-linear-to-l from-gray-50 to-transparent pointer-events-none sm:hidden" />
        </div>
      </div>

      {/* Search Metadata Info */}
      {/* Search result info message overlay inside ShopContent.tsx */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 animate-fade-in">
          <span>
            {products.length} result{products.length !== 1 ? "s" : ""} for
            <strong className="text-gray-800 ml-1">
              &quot;{searchQuery}&quot;
            </strong>
          </span>
          <button
            onClick={() => {
              setIsChanging(true);
              setTimeout(() => {
                // 1. Reset your local grid filters config object block
                setFilters((prev) => ({ ...prev, searchQuery: "" }));

                // 2. Synchronize URL query strings silently
                const params = new URLSearchParams(window.location.search);
                params.delete("q");
                const newUrl = params.toString()
                  ? `/?${params.toString()}`
                  : "/";
                window.history.replaceState(null, "", newUrl);

                // 3. Dispatch global signal informing Navbar to clear out its text box inputs instantly
                window.dispatchEvent(new CustomEvent("gasgo-search-clear"));

                setIsChanging(false);
              }, 120);
            }}
            className="ml-1 text-sky-500 hover:text-sky-600 font-semibold cursor-pointer transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Products Render Tree */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-7 bg-gray-100 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`transition-opacity duration-150 ease-in-out will-change-opacity ${isChanging ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p>
                {searchQuery
                  ? `No products found for "${searchQuery}"`
                  : "No products found."}
              </p>
            </div>
          ) : grouped ? (
            <div className="space-y-8">
              {grouped.map(({ category: cat, products: catProducts }) => (
                <CategorySection key={cat} cat={cat} products={catProducts} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Grid Footer Counter */}
          {products.length > 0 && (
            <div className="mt-10 mb-6 flex flex-col items-center gap-2 select-none">
              <div className="flex items-center gap-3 w-full max-w-xs">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-300">end of products</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <p className="text-[10px] text-gray-300">
                {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                shown
                {category ? " in this category" : " available"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

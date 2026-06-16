"use client";
import { Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCartStore();
  const [added, setAdded] = useState(false);
  const inCart = items.find((i) => i.product.id === product.id)?.quantity ?? 0;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-sky-200 hover:shadow-sm transition-all group">
      <Link href={`/products/${product.id}`}>
        <div className="h-28 bg-sky-50 flex items-center justify-center text-5xl relative">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            categoryEmoji(product.category)
          )}
          {!product.in_stock && (
            <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-medium text-gray-500">
              Out of stock
            </span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium truncate hover:text-sky-600">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 mb-2 capitalize">
            {product.category} · per {product.unit}
          </p>
          <p className="text-base font-semibold text-sky-600">
            ₱{product.price.toLocaleString()}
          </p>
        </Link>
        <button
          onClick={handleAdd}
          disabled={!product.in_stock}
          className={`mt-2 w-full py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors
            ${added ? "bg-green-500 text-white" : "bg-sky-500 text-white hover:bg-sky-600"}
            disabled:bg-gray-100 disabled:text-gray-400`}
        >
          {added ? (
            <>
              <Check size={14} /> Added
            </>
          ) : (
            <>
              <Plus size={14} /> Add to cart {inCart > 0 && `(${inCart})`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function categoryEmoji(cat: string) {
  const map: Record<string, string> = {
    tank: "🛢️",
    refill: "🔄",
    regulator: "🔧",
    accessory: "🔩",
    safety: "🧯",
  };
  return map[cat] ?? "📦";
}

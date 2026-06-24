"use client";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { showToast } from "@/components/Toast";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const [adding, setAdding] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigating when clicking Add
    setAdding(true);
    addItem(product);
    showToast(`${product.name} added to cart`, "success");
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-sky-200 hover:shadow-sm transition-all group flex flex-col">
      {/* Clicking image or name goes to product detail */}
      <Link href={`/products/${product.id}`} className="flex flex-col flex-1">
        {/* Image — square aspect ratio */}
        <div className="relative w-full aspect-square bg-sky-50 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4">
              <Image
                src="/logo.png"
                alt="placeholder"
                width={56}
                height={56}
                className="opacity-20 object-contain"
              />
              <span className="text-[10px] text-gray-300 text-center leading-tight">
                No image yet
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Name + description */}
        <div className="px-2.5 pt-2.5 pb-1 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2">
            {product.name}
          </p>
          {product.description && (
            <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
        </div>
      </Link>

      {/* Price + Add button — outside Link to avoid nested interaction */}
      <div className="px-2.5 pb-2.5 pt-1 flex items-center justify-between gap-1">
        <div>
          <span className="text-sm sm:text-base font-bold text-sky-600">
            ₱{product.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400 ml-1">
            /{product.unit}
          </span>
        </div>

        <button
          onClick={handleAdd}
          disabled={!product.in_stock || adding}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0
            ${
              adding
                ? "bg-green-500 text-white scale-95"
                : product.in_stock
                  ? "bg-sky-500 text-white hover:bg-sky-600 active:scale-95"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
        >
          {adding ? (
            <span>✓</span>
          ) : (
            <>
              <Plus size={11} />
              <span className="hidden sm:inline">Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

"use client";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  return (
    <button
      onClick={() => addItem(product)}
      disabled={!product.in_stock}
      className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-sky-600 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
    >
      <ShoppingCart size={18} />
      {product.in_stock ? "Add to cart" : "Out of stock"}
    </button>
  );
}

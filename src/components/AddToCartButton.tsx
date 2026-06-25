"use client";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";
import { showToast } from "@/components/Toast"; // Import your custom toast event bus

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    // 1. Add item to your Zustand store state
    addItem(product);

    // 2. Fire your custom confirmation alert using the correct parameters
    showToast(`Added ${product.name} to cart!`, "success");
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={!product.in_stock}
      className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-sky-600 disabled:bg-gray-100 disabled:text-gray-400 transition-colors cursor-pointer"
    >
      <ShoppingCart size={18} />
      {product.in_stock ? "Add to cart" : "Out of stock"}
    </button>
  );
}

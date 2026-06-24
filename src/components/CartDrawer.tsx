"use client";
import { useEffect } from "react";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setCartOpen,
    removeItem,
    addItem,
    updateQty,
    total,
  } = useCartStore();
  const router = useRouter();

  // Lock body scroll while open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  const onClose = () => setCartOpen(false);
  const goCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: isCartOpen ? "auto" : "none" }}
      aria-hidden={!isCartOpen}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: isCartOpen ? 1 : 0 }}
      />

      {/* Drawer */}
      <aside
        className="absolute top-0 right-0 h-full w-full sm:w-80 bg-white flex flex-col shadow-xl transition-transform duration-300 ease-out"
        style={{ transform: isCartOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <ShoppingCart size={16} className="text-sky-500" /> Your cart
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 items-start pb-3 border-b border-gray-50 last:border-0"
              >
                {/* Product image — uses uploaded image or logo placeholder */}
                <div className="w-14 h-14 bg-sky-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Image
                      src="/logo.png"
                      alt="placeholder"
                      width={32}
                      height={32}
                      className="opacity-20 object-contain"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 mb-1.5">
                    ₱{product.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="w-7 h-7 sm:w-6 sm:h-6 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => addItem(product)}
                      className="w-7 h-7 sm:w-6 sm:h-6 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-sky-600">
                    ₱{(product.price * quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => updateQty(product.id, 0)}
                    className="mt-1.5 p-1 text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-bold text-sky-600">
                ₱{total().toLocaleString()}
              </span>
            </div>
            <button
              onClick={goCheckout}
              className="w-full py-3 sm:py-2.5 bg-sky-500 text-white rounded-xl font-medium text-sm hover:bg-sky-600 transition-colors cursor-pointer"
            >
              Proceed to checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

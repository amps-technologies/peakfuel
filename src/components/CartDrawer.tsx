"use client";
import { useEffect, useState } from "react";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
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

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, addItem, updateQty, total } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Delay unmount so exit animation plays
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const effect = () => setMounted(true);
      effect();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      const effecttwo = () => setVisible(false);
      effecttwo();
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const goCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 h-full w-80 bg-white z-50 flex flex-col shadow-xl transition-transform duration-300 ease-out"
        style={{ transform: visible ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <ShoppingCart size={16} className="text-sky-500" /> Your cart
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

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
                <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                  {categoryEmoji(product.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 mb-1.5">
                    ₱{product.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => addItem(product)}
                      className="w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
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
                    className="mt-1.5 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-base font-bold text-sky-600">
                ₱{total().toLocaleString()}
              </span>
            </div>
            <button
              onClick={goCheckout}
              className="w-full py-2.5 bg-sky-500 text-white rounded-xl font-medium text-sm hover:bg-sky-600 transition-colors"
            >
              Proceed to checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

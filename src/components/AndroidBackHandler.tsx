"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function AndroidBackHandler() {
  const pathname = usePathname();
  const { isCartOpen, setCartOpen } = useCartStore();
  const [exitModal, setExitModal] = useState(false);

  useEffect(() => {
    // Push a dummy state so we can detect back button press
    window.history.pushState({ page: "current" }, "");

    const handlePopState = () => {
      // If cart is open — close it instead of going back
      if (useCartStore.getState().isCartOpen) {
        useCartStore.getState().setCartOpen(false);
        // Re-push state so next back press is also intercepted
        window.history.pushState({ page: "current" }, "");
        return;
      }

      // If on home page — show exit confirmation
      if (pathname === "/") {
        setExitModal(true);
        // Re-push state so the modal can be dismissed
        window.history.pushState({ page: "current" }, "");
        return;
      }

      // On any other page — let normal back navigation happen
      // Don't re-push state — allow browser to go back
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname]);

  // Re-push state when cart opens so back button can close it
  useEffect(() => {
    if (isCartOpen) {
      window.history.pushState({ page: "cart-open" }, "");
    }
  }, [isCartOpen]);

  if (!exitModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="font-semibold text-gray-900">Leave GasGo?</h2>
          <p className="text-sm text-gray-400 mt-1.5">
            Are you sure you want to exit?
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => setExitModal(false)}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Stay
          </button>
          <button
            onClick={() => {
              setExitModal(false);
              // Go back for real — let browser handle it
              window.history.go(-2);
            }}
            className="flex-1 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 cursor-pointer transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function AndroidBackHandler() {
  const pathname = usePathname();
  const router = useRouter();

  const [exitModal, setExitModal] = useState(false);
  const [modalIn, setModalIn] = useState(false);

  const isHome = pathname === "/";
  const store = useCartStore();

  const openModal = () => {
    setExitModal(true);
    setTimeout(() => setModalIn(true), 10);
  };

  const closeModal = () => {
    setModalIn(false);
    setTimeout(() => setExitModal(false), 250);
  };

  // Sync back button interception logic on mount and path changes safely
  useEffect(() => {
    // 1. Setup a clean visual boundary state
    const pushControlState = () => {
      if (
        typeof window !== "undefined" &&
        window.history.state?.type !== "back-trap"
      ) {
        window.history.pushState({ type: "back-trap" }, "");
      }
    };

    // Always push a single control state block on mount or path update
    pushControlState();

    const handlePopState = (event: PopStateEvent) => {
      // Check if the cart drawer layer is currently open
      if (store.isCartOpen) {
        store.setCartOpen(false);
        pushControlState(); // Re-trap the stack frame
        return;
      }

      // Check if the confirmation exit modal is currently open
      if (exitModal) {
        closeModal();
        pushControlState(); // Re-trap the stack frame
        return;
      }

      // Handle Home page specific app termination logic
      if (isHome) {
        openModal();
        pushControlState(); // Keep them on the home screen layout until verified
        return;
      }

      // If they are on a deeper subpage, let the hardware back button act naturally
      // We trigger a standard router.back() to let Next.js safely resolve path chunk histories
      router.back();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHome, store.isCartOpen, exitModal, router]);

  // Synchronize dynamic cart opening actions to force a control state block instantly
  useEffect(() => {
    if (store.isCartOpen && window.history.state?.type !== "back-trap") {
      window.history.pushState({ type: "back-trap" }, "");
    }
  }, [store.isCartOpen]);

  if (!exitModal) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{
        backgroundColor: `rgba(0,0,0,${modalIn ? 0.4 : 0})`,
        transition: "background-color 250ms ease-out",
      }}
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-xl"
        style={{
          opacity: modalIn ? 1 : 0,
          transform: modalIn
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(12px)",
          transition: "opacity 250ms ease-out, transform 250ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="font-bold text-gray-900 text-lg">Leave GasGo?</h2>
          <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
            Are you sure you want to exit the app?
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={closeModal}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Stay
          </button>
          <button
            onClick={() => {
              closeModal();
              // Exit the app gracefully by backing completely out of our control states
              setTimeout(() => {
                window.history.go(-2);
              }, 260);
            }}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 cursor-pointer transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

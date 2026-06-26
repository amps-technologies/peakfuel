"use client";
import { useEffect, useState } from "react";
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
    // Tiny microtask delay to let the Tailwind opacity transition animate smoothly
    setTimeout(() => setModalIn(true), 10);
  };

  const closeModal = () => {
    setModalIn(false);
    setTimeout(() => setExitModal(false), 200);
  };

  // Effect 1: Handle Back Button Trapping and Interception
  useEffect(() => {
    // Inject our secure entry key into the current history frame block
    const injectTrapState = () => {
      if (
        typeof window !== "undefined" &&
        window.history.state?.idx === undefined
      ) {
        window.history.pushState({ type: "gasgo-exit-trap" }, "");
      }
    };

    injectTrapState();

    const handlePopState = (event: PopStateEvent) => {
      // 1. If the cart drawer layout is open, close it and re-lock the trap
      if (store.isCartOpen) {
        store.setCartOpen(false);
        injectTrapState();
        return;
      }

      // 2. If the user is viewing the confirmation modal, close it and re-lock the trap
      if (exitModal) {
        closeModal();
        injectTrapState();
        return;
      }

      // 3. If the user is on the main homepage landing, capture input and present the exit prompt
      if (isHome) {
        openModal();
        injectTrapState();
        return;
      }

      // 4. If they are deep inside product pages, route backward natively using Next.js
      router.back();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHome, store.isCartOpen, exitModal, router]);

  // Effect 2: Force historical sync locks whenever subcomponents like the cart open
  useEffect(() => {
    if (store.isCartOpen) {
      window.history.pushState({ type: "gasgo-exit-trap" }, "");
    }
  }, [store.isCartOpen]);

  if (!exitModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none"
      style={{
        backgroundColor: `rgba(0,0,0,${modalIn ? 0.45 : 0})`,
        transition: "background-color 200ms ease-out",
      }}
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl border border-gray-100"
        style={{
          opacity: modalIn ? 1 : 0,
          transform: modalIn
            ? "scale(1) translateY(0)"
            : "scale(0.96) translateY(8px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="font-bold text-gray-900 text-lg">Leave GasGo?</h2>
          <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
            Are you sure you want to close the application?
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={closeModal}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
          >
            Stay
          </button>
          <button
            onClick={() => {
              closeModal();
              setTimeout(() => {
                // Clear out our domain location target directly to signal Android's container
                // shell that we want to drop out of this site tab entirely.
                window.close();
                window.location.replace("about:blank");
              }, 210);
            }}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 active:bg-black cursor-pointer transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

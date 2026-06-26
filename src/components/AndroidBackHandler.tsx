"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function AndroidBackHandler() {
  const pathname = usePathname();
  const [exitModal, setExitModal] = useState(false);
  const [modalIn, setModalIn] = useState(false);
  const isHome = pathname === "/";
  const blockedRef = useRef(false);

  const openModal = () => {
    setExitModal(true);
    setTimeout(() => setModalIn(true), 10);
  };

  const closeModal = () => {
    setModalIn(false);
    setTimeout(() => setExitModal(false), 250);
  };

  useEffect(() => {
    // Push a sentinel state once so we have something to pop
    if (!window.history.state?._sentinel) {
      window.history.replaceState({ _sentinel: true }, "");
      window.history.pushState({ _sentinel: true }, "");
    }

    const onPopState = () => {
      // If cart is open — close it, re-push sentinel, no navigation
      const store = useCartStore.getState();
      if (store.isCartOpen) {
        store.setCartOpen(false);
        window.history.pushState({ _sentinel: true }, "");
        return;
      }

      // If exit modal is showing — close it, re-push sentinel
      if (blockedRef.current) {
        closeModal();
        window.history.pushState({ _sentinel: true }, "");
        return;
      }

      // If on home page — show exit modal, re-push sentinel
      if (isHome) {
        openModal();
        blockedRef.current = true;
        window.history.pushState({ _sentinel: true }, "");
        return;
      }

      // Any other page — allow normal back, don't re-push
      // Next.js router handles the navigation
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isHome]);

  // Re-push sentinel when cart opens so back can close it
  useEffect(() => {
    const unsub = useCartStore.subscribe((state) => {
      if (state.isCartOpen) {
        window.history.pushState({ _sentinel: true }, "");
      }
    });
    return unsub;
  }, []);

  // Sync blockedRef with modal state
  useEffect(() => {
    if (!exitModal) blockedRef.current = false;
  }, [exitModal]);

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
              // Navigate away for real after modal closes
              setTimeout(() => window.history.go(-2), 260);
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

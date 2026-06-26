"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function AndroidBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const store = useCartStore();
  const isHome = pathname === "/";

  useEffect(() => {
    // 1. Inject a tracking state frame ONLY if a modal/drawer condition requires back-button interception
    const injectBackTrap = () => {
      if (
        typeof window !== "undefined" &&
        window.history.state?.type !== "drawer-open"
      ) {
        window.history.pushState({ type: "drawer-open" }, "");
      }
    };

    // If the cart drawer gets opened, immediately push a fake history state to trap the back button
    if (store.isCartOpen) {
      injectBackTrap();
    }

    const handlePopState = (event: PopStateEvent) => {
      // 2. Interception Case: If the cart drawer is open, close it instead of leaving the page
      if (store.isCartOpen) {
        store.setCartOpen(false);
        return; // Swallows the back button event, keeping them on the page
      }

      // 3. Subpage Case: If deep inside product details, use Next.js routing to step back safely
      if (!isHome) {
        router.back();
        return;
      }

      // 4. Homepage Case: No overlays are open. Do NOT call pushState or show a modal.
      // Let the natural popstate execute so the browser exits back to their previous site/google search.
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isHome, store.isCartOpen, store, router]);

  // This component doesn't render any HTML modal, meaning zero layout/white-screen refresh glitches!
  return null;
}

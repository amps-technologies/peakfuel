"use client";

import { useState, useEffect, startTransition, Suspense, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  MapPin,
  ShoppingCart,
  User as UserIcon,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

// ── Search Input Controller Nodes ────────────────────────────
function SearchInput({
  searchInput,
  setSearchInput,
  setIsMobileSearchOpen,
}: {
  searchInput: string;
  setSearchInput: (val: string) => void;
  setIsMobileSearchOpen: (val: boolean) => void;
}) {
  return (
    <>
      {/* DESKTOP SEARCH CONTAINER: Appears inline next to actions */}
      <div className="hidden md:block w-64 lg:w-80 relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all duration-150"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* MOBILE SEARCH TRIGGER ICON */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="p-2 text-gray-600 hover:text-sky-500 active:scale-95 transition-all cursor-pointer relative"
        >
          <Search size={20} />
          {searchInput.trim() && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full" />
          )}
        </button>
      </div>
    </>
  );
}

// ── Dynamic Back Button Component ───────────────────────────
function DynamicBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Define exactly which subpages should reveal the back prompt button shortcut
  const isProductDetail = pathname.startsWith("/products/");
  const isTrackPage = pathname === "/track";
  const isAuthPage = pathname === "/auth";
  const isProfilePage = pathname === "/profile";
  const isAdminPage = pathname === "/admin";

  const shouldShow =
    isProductDetail ||
    isTrackPage ||
    isAuthPage ||
    isProfilePage ||
    isAdminPage;

  if (!shouldShow) return null;

  return (
    <div className="shrink-0 animate-fade-in">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-sky-600 bg-sky-50 hover:bg-sky-100/80 active:scale-98 rounded-xl transition-all cursor-pointer font-semibold border border-sky-100"
      >
        <ArrowLeft size={14} className="stroke-[2.5]" />
        <span>Shop</span>
      </button>
    </div>
  );
}

// ── Root Unified Navbar Module ──────────────────────────────
export default function Navbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = createClient();
  const { items, setCartOpen } = useCartStore();

  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") ?? "";
    }
    return "";
  });

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const activeCategory = searchParams.get("category") ?? "";
  const isShop = pathname === "/";
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  // Sync Search Inputs if updated globally
  useEffect(() => {
    const handleGlobalClear = () => setSearchInput("");
    window.addEventListener("gasgo-search-clear", handleGlobalClear);
    return () =>
      window.removeEventListener("gasgo-search-clear", handleGlobalClear);
  }, []);

  // Autofocus mobile window panel input triggers
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 80);
    }
  }, [isMobileSearchOpen]);
  // High-speed client search debouncer configuration
  useEffect(() => {
    if (!isShop) return;

    const handle = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (searchInput.trim()) {
        params.set("q", searchInput.trim());
      } else {
        params.delete("q");
      }
      if (activeCategory) {
        params.set("category", activeCategory);
      }
      const url = params.toString() ? `/?${params.toString()}` : "/";
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new CustomEvent("gasgo-search-sync"));
    }, 220);

    return () => clearTimeout(handle);
  }, [searchInput, activeCategory, isShop]);

  // Auth synchronization tracking logic
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (active) {
        setUser(data.user);
        setMounted(true);
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          if (active) setUserRole(profile?.role ?? null);
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_e, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          setUserRole(profile?.role ?? null);
        } else {
          setUserRole(null);
        }
      },
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMobileSearchOpen(false);
  };

  return (
    <>
      <header className="app-navbar bg-white border-b border-gray-200 sticky top-0 z-50 h-14 select-none">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* LEFT AREA: Branding Group & Conditional Back Prompt */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1 font-semibold text-sky-600 text-base sm:text-lg cursor-pointer"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="logo"
                  height={28}
                  width={28}
                  priority
                />
              </div>
              <span>
                Peak<span className="text-gray-900">Fuel</span>
              </span>
            </Link>

            {/* Dynamic button renders automatically only on track, auth, or subpage routes */}
            <DynamicBackButton />
          </div>

          {/* RIGHT AREA: Search Elements and Actions grouped together aligned Right */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-end min-w-0">
            {/* Search items display strictly when navigating the main Shop workspace only */}
            {isShop && (
              <Suspense
                fallback={
                  <div className="hidden md:block w-64 h-8 bg-gray-50 rounded-lg animate-pulse" />
                }
              >
                <SearchInput
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  setIsMobileSearchOpen={setIsMobileSearchOpen}
                />
              </Suspense>
            )}

            {/* Track Button */}
            <Link
              href="/track"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium text-gray-600"
            >
              <MapPin size={15} />
              <span className="hidden sm:inline">Track</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium text-gray-600"
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">Cart</span>
              {mounted && count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>

            {/* Dynamic Authenticated Session Layout Nodes */}
            {mounted && user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {userRole === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium text-gray-600"
                  >
                    <Settings size={15} /> Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium text-gray-700"
                >
                  <UserIcon size={15} />
                  <span className="hidden sm:inline">
                    {user.email?.split("@")[0]}
                  </span>
                </Link>
              </div>
            ) : mounted ? (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer font-semibold"
              >
                <UserIcon size={15} />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            ) : (
              <div className="w-8 sm:w-20 h-8 bg-gray-50 rounded-lg animate-pulse shrink-0" />
            )}
          </div>
        </div>
      </header>

      {/* FLOATING TRANSPARENT APP-STYLE SEARCH DRAWER MODAL (z-51 Overlay) */}
      {isMobileSearchOpen && isShop && (
        <div
          className="fixed inset-0 z-51 bg-black/40 backdrop-blur-xs flex flex-col justify-start p-4 md:hidden animate-fade-in"
          onClick={() => setIsMobileSearchOpen(false)}
        >
          <form
            onSubmit={handleMobileSubmit}
            className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 mt-14 overflow-hidden flex flex-col p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-3 h-12 bg-gray-50 border border-gray-200 rounded-xl">
              <Search size={16} className="text-gray-400" />
              <input
                ref={mobileInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search cylinders & parts..."
                className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 py-1"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold text-xs rounded-xl hover:bg-gray-200 cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-sky-500 text-white font-semibold text-xs rounded-xl hover:bg-sky-600 cursor-pointer text-center shadow-xs"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

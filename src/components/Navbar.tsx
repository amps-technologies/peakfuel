"use client";
import { useState, useEffect, startTransition, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  MapPin,
  ShoppingCart,
  Package,
  User as UserIcon,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

// ── Only the search input needs useSearchParams ──────────────
// Isolating it here means only this tiny component can suspend,
// not the entire header. The sticky <header> shell never suspends.
function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const activeCategory = searchParams.get("category") ?? "";
  const isShop = pathname === "/";

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    startTransition(() => setSearchInput(q));
  }, [searchParams]);

  useEffect(() => {
    if (!isShop) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      const url = params.toString() ? `/?${params.toString()}` : "/";
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      if (url !== current) {
        router.push(url, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex-1 min-w-0 relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search products..."
        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-text transition-shadow duration-150"
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
  );
}

// ── Back-to-store also needs pathname ────────────────────────
function BackButton() {
  const router = useRouter();
  return (
    <div className="flex-1 min-w-0">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} />
        Back to store
      </button>
    </div>
  );
}

// ── Center area — picks search or back button ────────────────
function NavCenter() {
  const pathname = usePathname();
  const isShop = pathname === "/";
  const isProductDetail = pathname.startsWith("/products/");

  if (isShop) {
    return (
      <Suspense
        fallback={
          <div className="flex-1 min-w-0 h-8 bg-gray-100 rounded-lg animate-pulse" />
        }
      >
        <SearchInput />
      </Suspense>
    );
  }

  return isProductDetail ? (
    <div className="flex-1 min-w-0 h-8"></div>
  ) : (
    <BackButton />
  );
}

// ── Main navbar shell — never suspends, always sticky ───────
export default function Navbar() {
  const supabase = createClient();
  const { items, setCartOpen } = useCartStore();

  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (active) {
        setUser(data.user);
        setMounted(true);

        // Fetch role from profiles
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const signOut = async () => {
  //   await supabase.auth.signOut({ scope: "local" });
  //   window.location.href = "/";
  // };

  return (
    // This <header> is now ALWAYS rendered — never inside a Suspense
    // boundary that could swap it for a fallback <div>. sticky works.
    <header className="app-navbar bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 font-semibold text-sky-600 text-base sm:text-lg shrink-0 cursor-pointer"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
            <Image src="/logo.png" alt="logo" height={120} width={120} />
          </div>
          <span>
            Peak<span className="text-gray-900">Fuel</span>
          </span>
        </Link>

        {/* Center — search or back button, Suspense only wraps SearchInput */}
        <NavCenter />

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/track"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <MapPin size={15} />
            <span className="hidden sm:inline">Track</span>
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span className="hidden sm:inline">Cart</span>
            {mounted && count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          {mounted && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {userRole === "admin" && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Settings size={15} /> Admin
                </Link>
              )}
              {/* Profile link — replaces logout button */}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
            >
              <UserIcon size={15} />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          ) : (
            <div className="w-8 sm:w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}

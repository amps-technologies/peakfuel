"use client";
import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Flame,
  Search,
  X,
  MapPin,
  ShoppingCart,
  Package,
  LogOut,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import type { User } from "@supabase/supabase-js";

function NavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { items, setCartOpen } = useCartStore();

  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const isShop = pathname === "/";
  const activeCategory = searchParams.get("category") ?? "";
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user);
        setMounted(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync search input with URL param without causing ref-during-render warning
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    startTransition(() => setSearchInput(q));
  }, [searchParams]);

  // Debounced search → URL update
  useEffect(() => {
    if (!isShop) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (searchInput.trim()) params.set("q", searchInput.trim());
      const url = params.toString() ? `/?${params.toString()}` : "/";
      if (
        url !==
        `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
      ) {
        router.push(url, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const clearSearch = () => setSearchInput("");

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
  };

  return (
    <header className="app-navbar bg-white border-b border-gray-200 sticky top-0 z-50 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-sky-600 text-base sm:text-lg shrink-0 cursor-pointer"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-sky-500 rounded-lg flex items-center justify-center">
            <Flame size={14} className="text-white" />
          </div>
          <span>
            Peak<span className="text-gray-900">Fuel</span>
          </span>
        </Link>

        {/* Context-aware center area */}
        {isShop ? (
          <div className="flex-1 min-w-0 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              placeholder="Search products..."
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-text transition-shadow duration-150"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              Back to store
            </button>
          </div>
        )}

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
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Package size={15} /> Admin
              </Link>
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
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

export default function Navbar() {
  return <NavbarInner />;
}

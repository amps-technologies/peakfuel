"use client";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Flame,
  ShoppingCart,
  MapPin,
  LogOut,
  User as UserIcon,
  Package,
  Search,
  X,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  startTransition,
} from "react";
import CartDrawer from "./CartDrawer";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

export default function Navbar() {
  const count = useCartStore((s) => s.count());
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const isShop = pathname === "/";
  const activeCategory = searchParams.get("category") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const initializedRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [searchInput, setSearchInput] = useState(searchQuery);
  useEffect(() => {
    startTransition(() => {
      setSearchInput(searchQuery);
    });
  }, [searchQuery]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setMounted(true);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMounted(true);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (q) params.set("q", q);
      const url = params.toString() ? `/?${params.toString()}` : "/";
      router.push(url, { scroll: false });
    },
    [activeCategory, router],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);

    // Debounce — wait 300ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushSearch(val.trim());
    }, 300);
  };

  const clearSearch = () => {
    setSearchInput("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushSearch("");
  };

  const signOut = async () => {
    // 'local' only clears this browser session
    // other devices (rider app, other browsers) stay logged in
    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
  };

  const goCategory = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set("category", value);
    if (searchQuery) params.set("q", searchQuery);
    const url = params.toString() ? `/?${params.toString()}` : "/";
    router.push(url, { scroll: false });
  };

  const navCategories = [
    { label: "All", value: "" },
    { label: "Tanks", value: "tanks" },
    { label: "Refills", value: "refills" },
    { label: "Regulators", value: "regulators" },
    { label: "Accessories", value: "accessories" },
    { label: "Safety", value: "safety" },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sky-600 text-lg shrink-0 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center">
              {/* <Flame size={16} className="text-white" /> */}
              <Image src="/logo.png" alt="log" height={500} width={500} />
            </div>
            Peak<span className="text-gray-900">Fuel</span>
          </Link>

          {/* Live search input */}
          <div className="flex-1 max-w-sm relative">
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

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/track"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <MapPin size={15} /> Track
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ShoppingCart size={15} /> Cart
              {mounted && count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            {mounted && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Package size={15} /> Admin
                </Link>
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : mounted ? (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
              >
                <UserIcon size={15} /> Sign in
              </Link>
            ) : (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>
        </div>

        {/* Category nav — only on shop page */}
        {isShop && (
          <nav className="bg-sky-500">
            <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
              {navCategories.map((item) => (
                <button
                  key={item.value}
                  onClick={() => goCategory(item.value)}
                  className={`px-4 py-2 text-sm border-b-2 whitespace-nowrap transition-colors duration-150 cursor-pointer
                    ${
                      activeCategory === item.value
                        ? "text-white border-white font-medium"
                        : "text-sky-100 border-transparent hover:text-white hover:border-white"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

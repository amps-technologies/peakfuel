"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

export default function CartSync() {
  const { items, setUserId, userId } = useCartStore();
  const supabase = createClient();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = useRef(false);

  // Load cart from Supabase when user logs in
  const loadServerCart = async (uid: string) => {
    isLoading.current = true;
    try {
      const { data } = await supabase
        .from("carts")
        .select("items")
        .eq("user_id", uid)
        .maybeSingle();

      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        // Server has items — use server cart (cross-device sync)
        useCartStore.setState({ items: data.items });
        // Also update localStorage
        localStorage.setItem(`gasgo_cart_${uid}`, JSON.stringify(data.items));
      }
      // If server is empty, keep whatever was loaded from localStorage
    } catch {
      // Non-fatal — localStorage cart still works
    } finally {
      isLoading.current = false;
    }
  };

  // Save cart to Supabase (debounced to avoid too many writes)
  const saveServerCart = (uid: string, cartItems: typeof items) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (isLoading.current) return; // don't save while loading
      try {
        await supabase
          .from("carts")
          .upsert(
            {
              user_id: uid,
              items: cartItems,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
      } catch {
        // Non-fatal — local cart still works
      }
    }, 1000); // debounce 1 second
  };

  // Handle auth state changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) loadServerCart(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (event === "SIGNED_IN" && uid) {
        loadServerCart(uid);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to Supabase whenever items change
  useEffect(() => {
    if (userId && !isLoading.current) {
      saveServerCart(userId, items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, userId]);

  return null;
}

"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

export default function CartSync() {
  const { items, setUserId, userId } = useCartStore();
  const supabase = createClient();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = useRef(false);

  const loadServerCart = async (uid: string) => {
    isLoading.current = true;
    try {
      const { data } = await supabase
        .from("carts")
        .select("items")
        .eq("user_id", uid)
        .maybeSingle();

      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        useCartStore.setState({ items: data.items });
        try {
          localStorage.setItem(`gasgo_cart_${uid}`, JSON.stringify(data.items));
        } catch {}
      }
    } catch {
    } finally {
      isLoading.current = false;
    }
  };

  const saveServerCart = (uid: string, cartItems: typeof items) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    // Use 0ms delay for empty cart (checkout), 800ms for normal changes
    const delay = cartItems.length === 0 ? 0 : 800;
    saveTimeout.current = setTimeout(async () => {
      if (isLoading.current) return;
      try {
        await supabase.from("carts").upsert(
          {
            user_id: uid,
            items: cartItems,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } catch {}
    }, delay);
  };

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

  useEffect(() => {
    if (userId && !isLoading.current) {
      saveServerCart(userId, items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, userId]);

  return null;
}

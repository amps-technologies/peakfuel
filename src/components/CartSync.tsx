"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

export default function CartSync() {
  const setUserId = useCartStore((s) => s.setUserId);
  const supabase = createClient();

  useEffect(() => {
    // Handle already-logged-in user on first load
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    // Handle login/logout events
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUserId(session?.user?.id ?? null);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// app/track/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";
import TrackClient from "./TrackClient";

export default async function TrackLookupPage() {
  const supabase = await createClient();

  // getClaims() verifies the JWT locally (cached JWKS) — no network call.
  // proxy.ts already refreshed the session, so we don't need getUser() here.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  let orders: Order[] = [];

  if (userId) {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    orders = (ordersData as Order[]) ?? [];
  }

  return <TrackClient initialOrders={orders} />;
}

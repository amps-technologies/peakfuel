// app/track/page.tsx
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";
import TrackClient from "./TrackClient";

export default async function TrackLookupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orders: Order[] = [];

  if (user) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    orders = (data as Order[]) ?? [];
  }

  return <TrackClient initialOrders={orders} />;
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!["admin", "rider"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId } = await params;
    const { status, rider_id } = await req.json();

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // If marking as on_the_way, ensure delivery row exists
    if (status === "on_the_way") {
      await supabase.from("deliveries").upsert(
        {
          order_id: orderId,
          rider_id: rider_id ?? null,
          status: "on_the_way",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" },
      );
    }

    return NextResponse.json({ order: data });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

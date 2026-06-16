import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { order_id, lat, lng, rider_id } = await req.json();

    if (!order_id || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Upsert delivery row — creates it if not yet existing
    const { error } = await supabase.from("deliveries").upsert(
      {
        order_id,
        rider_id: rider_id ?? null,
        lat,
        lng,
        status: "on_the_way",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

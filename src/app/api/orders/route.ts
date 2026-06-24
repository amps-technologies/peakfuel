import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const body = await req.json();
    console.log("=== ORDER POST ===");
    console.log("user:", user?.email ?? "guest");
    console.log("body keys:", Object.keys(body));
    console.log("items count:", body.items?.length);
    console.log("address:", body.address);
    console.log("payment_method:", body.payment_method);
    console.log(
      "SERVICE_ROLE_KEY set:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { items, address, payment_method, guest_name, guest_phone } = body;

    if (!items?.length || !address || !payment_method) {
      console.log("VALIDATION FAILED:", {
        items: !!items?.length,
        address: !!address,
        payment_method: !!payment_method,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const total = items.reduce(
      (sum: number, i: { price: number; quantity: number }) =>
        sum + i.price * i.quantity,
      0,
    );

    console.log("Inserting order, total:", total);

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        guest_name: guest_name ?? null,
        guest_phone: guest_phone ?? null,
        address,
        payment_method,
        status: "pending",
        total,
      })
      .select()
      .single();

    if (orderError) {
      console.error("ORDER INSERT ERROR:", orderError);
      return NextResponse.json(
        { error: orderError.message, details: orderError },
        { status: 400 },
      );
    }

    console.log("Order created:", order.id);

    const { error: itemsError } = await admin.from("order_items").insert(
      items.map(
        (i: { product_id: string; quantity: number; price: number }) => ({
          order_id: order.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.price,
        }),
      ),
    );

    if (itemsError) {
      console.error("ORDER ITEMS INSERT ERROR:", itemsError);
      return NextResponse.json(
        { error: itemsError.message, details: itemsError },
        { status: 400 },
      );
    }

    if (user) {
      await admin
        .from("profiles")
        .update({
          full_name: guest_name ?? null,
          phone: guest_phone ?? null,
          delivery_address: address ?? null,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({ order });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("=== ORDERS API EXCEPTION ===", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

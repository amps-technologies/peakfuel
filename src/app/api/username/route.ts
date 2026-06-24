import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// GET /api/username?username=juan — check if username is taken
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams
    .get("username")
    ?.trim()
    .toLowerCase();
  if (!username) return NextResponse.json({ available: false });

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}

// POST /api/username — look up email by username for login
export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Username not found" }, { status: 404 });
  }

  // Get email from auth.users
  const { data: userData } = await admin.auth.admin.getUserById(data.id);
  if (!userData.user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ email: userData.user.email });
}

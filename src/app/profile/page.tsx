// app/profile/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export interface Profile {
  full_name: string | null;
  phone: string | null;
  delivery_address: string | null;
  role: string | null;
  username: string | null;
}

export default async function ProfilePage() {
  const supabase = await createClient();

  // getClaims() verifies the JWT locally (cached JWKS) — no network call.
  // proxy.ts already refreshed the session, so we don't need getUser() here.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, delivery_address, role, username")
    .eq("id", claims.sub)
    .single();

  return (
    <ProfileClient
      email={(claims.email as string) ?? null}
      profile={profile as Profile | null}
    />
  );
}

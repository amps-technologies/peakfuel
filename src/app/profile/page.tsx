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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, delivery_address, role, username")
    .eq("id", user.id)
    .single();

  return (
    <ProfileClient
      email={user.email ?? null}
      profile={profile as Profile | null}
    />
  );
}

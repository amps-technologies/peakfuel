// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

// export default async function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     redirect("/auth");
//   }

//   const { data: profile, error: profileError } = await supabase
//     .from("profiles")
//     .select("role")
//     .eq("id", user.id)
//     .single();

//   if (profileError || !profile) {
//     redirect("/");
//   }

//   if (profile.role !== "admin") {
//     redirect("/");
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
//         <span className="text-lg">🔥</span>
//         <span className="font-semibold text-gray-800">GasGo Admin</span>
//         <span className="ml-auto text-xs text-gray-400">{user.email}</span>
//       </div>
//       {children}
//     </div>
//   );
// }

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("ADMIN LAYOUT - user:", user?.id, user?.email);
  console.log("ADMIN LAYOUT - userError:", userError);

  if (userError || !user) {
    console.log("ADMIN LAYOUT - redirecting to /auth, no user");
    redirect("/auth");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("ADMIN LAYOUT - profile:", profile);
  console.log("ADMIN LAYOUT - profileError:", profileError);

  if (profileError || !profile) {
    console.log("ADMIN LAYOUT - redirecting to /, no profile");
    redirect("/");
  }

  if (profile.role !== "admin") {
    console.log("ADMIN LAYOUT - redirecting to /, role is:", profile.role);
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3">
        <span className="text-lg">🔥</span>
        <span className="font-semibold text-gray-800">GasGo Admin</span>
        <span className="ml-auto text-xs text-gray-400">{user.email}</span>
      </div>
      {children}
    </div>
  );
}

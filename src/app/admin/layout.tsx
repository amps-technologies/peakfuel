import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Monitor } from "lucide-react";
import Link from "next/link";

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
  if (userError || !user) redirect("/auth");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/");
  if (profile.role !== "admin") redirect("/");

  return (
    <>
      {/* Mobile blocker — shown only below sm breakpoint */}
      <div className="sm:hidden min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor size={28} className="text-sky-500" />
          </div>
          <h1 className="font-semibold text-gray-800 mb-2">Desktop only</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            The admin panel is currently only accessible through a web browser
            on a desktop or laptop computer for the best experience.
          </p>
          <Link
            href="/"
            className="inline-block mt-5 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors cursor-pointer"
          >
            Back to store
          </Link>
        </div>
      </div>

      {/* Actual admin panel — hidden on mobile, shown sm and up */}
      <div className="hidden sm:block">{children}</div>
    </>
  );
}

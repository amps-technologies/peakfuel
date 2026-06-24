"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  LogOut,
  MapPin,
  ShoppingBag,
  Smartphone,
  ChevronRight,
  Download,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const RIDER_APK_URL =
  "https://github.com/yourusername/gasgo-releases/releases/download/v1.0.0/gasgo-rider.apk";

interface Profile {
  full_name: string | null;
  phone: string | null;
  delivery_address: string | null;
  role: string | null;
  username: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, delivery_address, role, username")
        .eq("id", user.id)
        .single();

      setProfile(data as Profile);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
  };

  const cleanAddress = (addr: string) =>
    addr.replace(/\s*\[.*?\]\s*/g, "").trim();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* Avatar + name */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center shrink-0">
            <User size={28} className="text-sky-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">
              {profile?.full_name ?? "Guest user"}
            </p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            {profile?.role && profile.role !== "customer" && (
              <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 capitalize">
                {profile.role}
              </span>
            )}
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Delivery info
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <User size={15} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Full name</p>
                <p className="text-sm text-gray-700 truncate">
                  {profile?.full_name ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Smartphone size={15} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Phone number</p>
                <p className="text-sm text-gray-700">{profile?.phone ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <MapPin size={15} className="text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Saved delivery address</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {profile?.delivery_address
                    ? cleanAddress(profile.delivery_address)
                    : "Not set — will be saved on next checkout"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Quick links
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            <button
              onClick={() => router.push("/track")}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ShoppingBag size={15} className="text-gray-300 shrink-0" />
              <span className="flex-1 text-sm text-gray-700 text-left">
                My orders
              </span>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <MapPin size={15} className="text-gray-300 shrink-0" />
              <span className="flex-1 text-sm text-gray-700 text-left">
                Browse products
              </span>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          </div>
        </div>

        {/* Rider app download */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center shrink-0 text-lg">
              🛵
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sky-800">
                Are you a delivery rider?
              </p>
              <p className="text-xs text-sky-600 mt-0.5 leading-relaxed">
                Download the rider app to manage and track your deliveries.
                Android only.
              </p>
              <a
                href={RIDER_APK_URL}
                download="GasGo-Rider-v1.0.apk"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-1.5 bg-sky-500 text-white text-xs font-medium rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
              >
                <Download size={12} />
                Download Rider APK
              </a>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => setLogoutModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-500 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          Sign out
        </button>

        <p className="text-center text-[10px] text-gray-300 pb-4">
          Delivery details are saved automatically on checkout.
        </p>
      </div>

      {/* Logout confirmation modal */}
      {logoutModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut size={20} className="text-red-500" />
              </div>
              <h2 className="font-semibold text-gray-900">Sign out?</h2>
              <p className="text-sm text-gray-400 mt-1.5">
                You will be redirected to the home page.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={14} /> Sign out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

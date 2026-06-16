"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Flame, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

type Tab = "signin" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    setAnimating(true);
    setError("");
    setTimeout(() => {
      setTab(t);
      setAnimating(false);
    }, 200);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else router.push("/");
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) setError(error.message);
    else router.push("/");
    setLoading(false);
  };

  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white";
  const labelClass = "block text-xs text-gray-500 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-16">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm shadow-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 text-sky-600 font-bold text-xl pt-6 pb-4">
          <Flame size={22} />
          Peak Fuel
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => switchTab("signin")}
            className={`flex-1 pb-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
              tab === "signin"
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => switchTab("signup")}
            className={`flex-1 pb-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
              tab === "signup"
                ? "border-sky-500 text-sky-600"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Form body */}
        <div
          className="px-6 pt-5 pb-6 space-y-4 transition-all duration-200 ease-out"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(6px)" : "translateY(0)",
          }}
        >
          {/* Sign in fields */}
          {tab === "signin" && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sign up fields */}
          {tab === "signup" && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={tab === "signin" ? handleSignIn : handleSignUp}
            disabled={loading}
            className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-medium text-sm hover:bg-sky-600 disabled:opacity-60 transition-colors"
          >
            {loading
              ? "Please wait..."
              : tab === "signin"
                ? "Sign in"
                : "Create account"}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or</span>
            </div>
          </div>

          {/* Guest */}
          <Link
            href="/"
            className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Flame, Eye, EyeOff, Check, X } from "lucide-react";

type Mode = "signin" | "signup";

// Username rules
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_REGEX = /^[a-z0-9_]+$/;

function validateUsername(u: string): string | null {
  if (u.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters`;
  if (u.length > USERNAME_MAX) return `Max ${USERNAME_MAX} characters`;
  if (!USERNAME_REGEX.test(u))
    return "Only lowercase letters, numbers, underscore";
  return null;
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [identifier, setIdentifier] = useState(""); // username or email for signin
  const [email, setEmail] = useState(""); // signup only
  const [username, setUsername] = useState(""); // signup only
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Username availability check
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = useCallback(async (value: string) => {
    const cleaned = value.trim().toLowerCase();
    const validErr = validateUsername(cleaned);
    if (validErr) {
      setUsernameError(validErr);
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/username?username=${cleaned}`);
      const data = (await res.json()) as { available: boolean };
      setUsernameAvailable(data.available);
      setUsernameError(data.available ? "" : "Username already taken");
    } catch {
      setUsernameError("");
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Resolve identifier to email for sign-in
  const resolveEmail = async (raw: string): Promise<string | null> => {
    const cleaned = raw.trim().toLowerCase();
    if (cleaned.includes("@")) return cleaned; // already an email

    // Look up username → email via API
    const res = await fetch("/api/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleaned }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  };

  const handleSignIn = async () => {
    if (!identifier.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const email = await resolveEmail(identifier);
      if (!email) {
        setError("Username not found. Try signing in with your email instead.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("Invalid username/email or password.");
        return;
      }
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const usernameErr = validateUsername(username.trim().toLowerCase());
    if (usernameErr) {
      setError(usernameErr);
      return;
    }
    if (usernameAvailable === false) {
      setError("Username already taken.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const cleanUsername = username.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username: cleanUsername },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }

      // Save username to profile immediately
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ username: cleanUsername })
          .eq("id", data.user.id);
      }

      setEmailSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      mode === "signin" ? handleSignIn() : handleSignUp();
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setIdentifier("");
    setEmail("");
    setUsername("");
    setPassword("");
    setUsernameAvailable(null);
    setUsernameError("");
  };

  if (emailSent) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          We sent a confirmation link to{" "}
          <strong className="text-gray-700">{email}</strong>. Click the link to
          activate your account.
        </p>
        <p className="text-xs text-gray-400">
          Your username will be{" "}
          <strong className="text-gray-600 font-mono">
            @{username.trim().toLowerCase()}
          </strong>
        </p>
        <button
          onClick={() => {
            setEmailSent(false);
            setMode("signin");
          }}
          className="text-sm text-sky-500 hover:text-sky-600 cursor-pointer"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Flame size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {mode === "signin"
              ? "Sign in with your username or email"
              : "Join GasGo for faster checkout"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                ${
                  mode === m
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Username or email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="juan_delacruz or you@email.com"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50"
              />
            </div>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <>
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Username
                </label>
                <div className="relative">
                  {/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    @
                  </span> */}
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "");
                      setUsername(val);
                      setUsernameAvailable(null);
                      setUsernameError("");
                      setError("");
                    }}
                    onBlur={() => {
                      if (username.trim()) checkUsername(username);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="juan_delacruz"
                    maxLength={USERNAME_MAX}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username"
                    className={`w-full pl-3 pr-9 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50
                      ${
                        usernameAvailable === true
                          ? "border-green-400"
                          : usernameAvailable === false
                            ? "border-red-300"
                            : "border-gray-200"
                      }`}
                  />
                  {/* Availability indicator */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    ) : usernameAvailable === true ? (
                      <Check size={15} className="text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X size={15} className="text-red-400" />
                    ) : null}
                  </span>
                </div>
                {usernameError ? (
                  <p className="text-[10px] text-red-500 mt-1">
                    {usernameError}
                  </p>
                ) : usernameAvailable === true ? (
                  <p className="text-[10px] text-green-600 mt-1">
                    ✓ Username available
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {USERNAME_MIN}–{USERNAME_MAX} characters · letters, numbers,
                    underscore only
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Used for account recovery and order confirmations only
                </p>
              </div>
            </>
          )}

          {/* Password — shared */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "signup" ? "At least 6 characters" : "Your password"
                }
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={mode === "signin" ? handleSignIn : handleSignUp}
            disabled={
              loading || (mode === "signup" && usernameAvailable === false)
            }
            className="w-full py-2.5 bg-sky-500 text-white rounded-xl font-medium text-sm hover:bg-sky-600 disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : mode === "signin" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            to submit
          </p>
        </div>
      </div>

      {/* Guest option */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Just browsing?{" "}
        <button
          onClick={() => router.push("/")}
          className="text-sky-500 hover:text-sky-600 cursor-pointer"
        >
          Continue as guest →
        </button>
      </p>
    </div>
  );
}

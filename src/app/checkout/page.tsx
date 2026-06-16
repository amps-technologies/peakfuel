"use client";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CreditCard,
  ShoppingBag,
  ChevronRight,
  Pin,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
});

type Step = "delivery" | "payment";
type PaymentMethod = "cod" | "gcash" | "maya" | "card";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("delivery");
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Delivery fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [schedule, setSchedule] = useState("asap");

  // Payment
  const [method, setMethod] = useState<PaymentMethod>("cod");

  // Auto-fill from profile
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPrefilling(false);
        return;
      }

      setProfileId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name, phone, delivery_address, delivery_lat, delivery_lng",
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.phone) setPhone(profile.phone);
        if (profile.delivery_address) {
          setAddress(profile.delivery_address);
          if (profile.delivery_lat) setAddressLat(profile.delivery_lat);
          if (profile.delivery_lng) setAddressLng(profile.delivery_lng);
        }
      }
      setPrefilling(false);
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfileDetails = async () => {
    if (!profileId) return;
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          delivery_address: address || null,
          delivery_lat: addressLat,
          delivery_lng: addressLng,
        })
        .eq("id", profileId);
    } catch {
      // Non-critical — don't block order
    }
  };

  const handleLocationConfirm = (addr: string, lat: number, lng: number) => {
    setAddress(addr);
    setAddressLat(lat);
    setAddressLng(lng);
    setAddressError("");
    setShowPicker(false);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      // Save delivery details to profile for next time
      await saveProfileDetails();

      const payload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        address:
          address +
          (addressLat
            ? ` [${addressLat.toFixed(6)},${addressLng?.toFixed(6)}]`
            : ""),
        payment_method: method,
        guest_name: fullName || "Guest",
        guest_phone: phone || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      clearCart();
      router.push(`/track/${data.order.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-400">
        <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium mb-2">Your cart is empty</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 cursor-pointer"
        >
          Browse products
        </button>
      </div>
    );
  }

  return (
    <>
      {showPicker && (
        <LocationPicker
          onConfirm={handleLocationConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {(["delivery", "payment"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${
                    step === s || (s === "delivery" && step === "payment")
                      ? "bg-sky-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm font-medium capitalize transition-colors
                  ${step === s ? "text-sky-600" : "text-gray-400"}`}
                >
                  {s}
                </span>
              </div>
              {i === 0 && (
                <ChevronRight size={16} className="text-gray-300 ml-auto" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Form */}
          <div className="md:col-span-3 space-y-4">
            {step === "delivery" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <MapPin size={16} className="text-sky-500" />
                    Delivery details
                  </h2>
                  {profileId && (
                    <span className="text-xs text-sky-500 flex items-center gap-1">
                      <User size={11} /> Auto-filled from profile
                    </span>
                  )}
                </div>

                {prefilling ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    Loading your saved details...
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Full name
                      </label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Juan dela Cruz"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Phone number <span className="text-red-400">*</span>
                      </label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Delivery address <span className="text-red-400">*</span>
                      </label>

                      <button
                        onClick={() => setShowPicker(true)}
                        className={`w-full mb-2 px-3 py-2.5 border-2 border-dashed rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer
                          ${
                            addressLat
                              ? "border-sky-300 bg-sky-50 text-sky-600"
                              : "border-gray-200 text-gray-400 hover:border-sky-300 hover:text-sky-500"
                          }`}
                      >
                        <Pin size={15} />
                        {addressLat
                          ? "📍 Location pinned — tap to change"
                          : "Pin location on map"}
                      </button>

                      <textarea
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setAddressLat(null);
                          setAddressLng(null);
                          setAddressError("");
                        }}
                        placeholder="Or type your address&#10;House/Unit, Street, Barangay, City"
                        rows={2}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none
                          ${addressError ? "border-red-300" : "border-gray-200"}`}
                      />

                      {addressError && (
                        <p className="text-xs text-red-500 mt-1">
                          {addressError}
                        </p>
                      )}

                      {addressLat && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          ✓ GPS coordinates saved — will be used for route
                          planning
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Delivery schedule
                      </label>
                      <select
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                      >
                        <option value="asap">ASAP (within 2 hours)</option>
                        <option value="afternoon">
                          Today afternoon (2–6 PM)
                        </option>
                        <option value="tomorrow-am">
                          Tomorrow morning (8 AM–12 PM)
                        </option>
                        <option value="tomorrow-pm">
                          Tomorrow afternoon (1–6 PM)
                        </option>
                      </select>
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    if (!address.trim()) {
                      setAddressError(
                        "Please enter or pin your delivery address.",
                      );
                      return;
                    }
                    if (!phone.trim()) {
                      setAddressError("Please enter your phone number.");
                      return;
                    }
                    setAddressError("");
                    setError("");
                    setStep("payment");
                  }}
                  disabled={prefilling}
                  className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-medium text-sm hover:bg-sky-600 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Continue to payment →
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <CreditCard size={16} className="text-sky-500" />
                  Payment method
                </h2>

                {[
                  { value: "cod", label: "Cash on delivery", icon: "💵" },
                  { value: "gcash", label: "GCash", icon: "📱" },
                  { value: "maya", label: "Maya", icon: "💳" },
                  { value: "card", label: "Credit / Debit card", icon: "🏦" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors
                      ${
                        method === opt.value
                          ? "border-sky-400 bg-sky-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={method === opt.value}
                      onChange={() => setMethod(opt.value as PaymentMethod)}
                      className="accent-sky-500"
                    />
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep("delivery")}
                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-60 cursor-pointer transition-colors"
                  >
                    {loading ? "Placing order..." : "Place order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-20">
              <h2 className="font-semibold mb-4">Order summary</h2>
              <div className="space-y-3 mb-4">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate pr-2">
                      {product.name} × {quantity}
                    </span>
                    <span className="font-medium shrink-0">
                      ₱{(product.price * quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-sky-600">
                  ₱{total().toLocaleString()}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-400 flex items-start gap-1.5">
                <MapPin size={12} className="mt-0.5 shrink-0 text-sky-400" />
                GPS tracking activates once your rider picks up the order.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

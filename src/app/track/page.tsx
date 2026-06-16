"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Package, ChevronRight, Clock } from "lucide-react";
import type { Order } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  on_the_way: "bg-sky-100 text-sky-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function TrackLookupPage() {
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders((data as Order[]) ?? []);
      setLoading(false);
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrack = () => {
    const trimmed = orderId.trim();
    if (!trimmed) {
      setError("Please enter an order ID.");
      return;
    }
    router.push(`/track/${trimmed}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin size={22} className="text-sky-500" />
        </div>
        <h1 className="text-xl font-bold">Track your order</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select an order below or enter your order ID
        </p>
      </div>

      {/* My orders */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Your orders
          </p>
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/track/${order.id}`)}
              className="w-full bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-sky-200 hover:shadow-sm transition-all cursor-pointer text-left"
            >
              <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                <Package size={16} className="text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {order.address}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {new Date(order.created_at).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-sky-600">
                  ₱{order.total.toLocaleString()}
                </p>
                <ChevronRight
                  size={14}
                  className="text-gray-300 ml-auto mt-1"
                />
              </div>
            </button>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No orders found for your account.
          </div>
        )
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-3 text-xs text-gray-400">
            or enter order ID manually
          </span>
        </div>
      </div>

      {/* Manual entry */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Order ID</label>
          <input
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTrack();
            }}
            placeholder="e.g. 2b60b4c0-f7a7-..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-text font-mono"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          onClick={handleTrack}
          className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-medium text-sm hover:bg-sky-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <MapPin size={15} /> Track order
        </button>
      </div>
    </div>
  );
}

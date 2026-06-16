"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation, Package, ChevronRight } from "lucide-react";
import type { Order } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  on_the_way: "bg-sky-100 text-sky-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function RiderSelectorPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualId, setManualId] = useState("");
  const [inputErr, setInputErr] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["confirmed", "packed", "on_the_way"])
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualTrack = () => {
    const trimmed = manualId.trim();
    if (!trimmed) {
      setInputErr("Please enter an order ID.");
      return;
    }
    router.push(`/rider/${trimmed}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">🛵</div>
        <h1 className="text-xl font-bold">Rider Panel</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select an order to start GPS tracking
        </p>
      </div>

      {/* Active orders list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Active orders
          </p>
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/rider/${order.id}`)}
              className="w-full bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-sky-200 hover:shadow-sm transition-all cursor-pointer text-left"
            >
              <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                <Package size={16} className="text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium font-mono">
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
                <p className="text-xs font-semibold text-sky-600 mt-0.5">
                  ₱{order.total.toLocaleString()}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 text-sm bg-white border border-gray-100 rounded-xl">
          No active orders at the moment.
        </div>
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
            value={manualId}
            onChange={(e) => {
              setManualId(e.target.value);
              setInputErr("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleManualTrack();
            }}
            placeholder="e.g. 2b60b4c0-f7a7-..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-text font-mono"
          />
          {inputErr && <p className="text-xs text-red-500 mt-1">{inputErr}</p>}
        </div>
        <button
          onClick={handleManualTrack}
          className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-medium text-sm hover:bg-sky-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Navigation size={15} /> Start tracking this order
        </button>
      </div>
    </div>
  );
}

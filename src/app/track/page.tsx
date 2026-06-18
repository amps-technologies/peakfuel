"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  Package,
  ChevronRight,
  Clock,
  Calendar,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  on_the_way: "bg-sky-100 text-sky-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "On the way", value: "on_the_way" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE = 6;

function cleanAddress(address: string): string {
  return address.replace(/\s*\[.*?\]\s*/g, "").trim();
}

export default function TrackLookupPage() {
  const [orderId, setOrderId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Default to "on the way" status, current date
  const today = new Date().toISOString().split("T")[0];
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">(
    "on_the_way",
  );
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(1);

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

  // Reset to page 1 whenever filters change
  // useEffect(() => {
  //   setPage(1)
  // }, [statusFilter, dateFrom, dateTo])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at).toISOString().split("T")[0];
      const matchesDate = orderDate >= dateFrom && orderDate <= dateTo;
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesDate && matchesStatus;
    });
  }, [orders, dateFrom, dateTo, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleTrack = () => {
    const trimmed = orderId.trim();
    if (!trimmed) {
      setError("Please enter an order ID.");
      return;
    }
    router.push(`/track/${trimmed}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MapPin size={22} className="text-sky-500" />
        </div>
        <h1 className="text-xl font-bold">Track your orders</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select an order below or enter your order ID
        </p>
      </div>

      {/* Status tabs */}
      {/* <div className="flex gap-0 overflow-x-auto border-b border-gray-100 -mx-1 px-1">
        {STATUS_TABS.map((tabItem) => (
          <button
            key={tabItem.value}
            onClick={() => {
              setStatusFilter(tabItem.value);
              setPage(1);
            }}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0
    ${
      statusFilter === tabItem.value
        ? "text-sky-600 border-sky-500 font-medium"
        : "text-gray-400 border-transparent hover:text-gray-600"
    }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div> */}

      {/* Date range filter */}
      {/* <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5">
        <Calendar size={15} className="text-gray-400 shrink-0" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          max={dateTo}
          className="flex-1 text-sm bg-transparent focus:outline-none cursor-pointer min-w-0"
        />
        <span className="text-xs text-gray-400 shrink-0">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          min={dateFrom}
          max={today}
          className="flex-1 text-sm bg-transparent focus:outline-none cursor-pointer min-w-0"
        />
      </div> */}

      {/* Filters — status dropdown + date range */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | "all");
            setPage(1);
          }}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer font-medium text-gray-700 shrink-0"
        >
          {STATUS_TABS.map((tabItem) => (
            <option key={tabItem.value} value={tabItem.value}>
              {tabItem.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5 flex-1 min-w-55">
          <Calendar size={15} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            max={dateTo}
            className="flex-1 text-sm bg-transparent focus:outline-none cursor-pointer min-w-0"
          />
          <ArrowRight size={13} className="text-gray-300 shrink-0" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            min={dateFrom}
            max={today}
            className="flex-1 text-sm bg-transparent focus:outline-none cursor-pointer min-w-0"
          />
        </div>
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
      ) : paginatedOrders.length > 0 ? (
        <>
          <div className="space-y-2">
            {paginatedOrders.map((order) => (
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
                    {cleanAddress(order.address)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
          No orders found for this status and date range.
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

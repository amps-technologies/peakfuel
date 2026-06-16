"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Package,
  CheckCircle,
  Truck,
  Home,
  Clock,
  ChevronRight,
} from "lucide-react";
import { showToast } from "@/components/Toast";
import type { Delivery, Order } from "@/types";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), {
  ssr: false,
});

const steps = [
  { key: "pending", label: "Order placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "packed", label: "Packed", icon: Package },
  { key: "on_the_way", label: "On the way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

// Statuses where map should be shown
const SHOW_MAP_STATUSES = ["on_the_way"];
const ACTIVE_STATUSES = ["pending", "confirmed", "packed", "on_the_way"];

export default function TrackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deliveredTimer, setDeliveredTimer] = useState<number | null>(null);
  const [showDeliveredMap, setShowDeliveredMap] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchData = async () => {
      const { data: o, error: oErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (oErr || !o) {
        setNotFound(true);
        setLoading(false);
        showToast("Order not found.", "error");
        return;
      }
      setOrder(o as Order);

      const { data: d } = await supabase
        .from("deliveries")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (d) setDelivery(d as Delivery);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`track-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            setDelivery(payload.new as Delivery);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const updated = payload.new as Order;
            setOrder(updated);
            if (updated.status === "delivered") {
              showToast("Your order has been delivered! 🎉", "success");
              // Show map for 30s after delivery then hide it
              setShowDeliveredMap(true);
              const t = window.setTimeout(() => {
                setShowDeliveredMap(false);
              }, 30000);
              setDeliveredTimer(t);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (deliveredTimer) clearTimeout(deliveredTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const currentStepIndex = steps.findIndex((s) => s.key === order?.status);
  const showMap =
    order?.status === "on_the_way" ||
    (order?.status === "delivered" && showDeliveredMap);
  const isDelivered = order?.status === "delivered";
  const isCancelled = order?.status === "cancelled";
  const isActive = order ? ACTIVE_STATUSES.includes(order.status) : false;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        <Clock size={32} className="mx-auto mb-2 animate-spin opacity-40" />
        <p>Loading your order...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-semibold text-gray-700 mb-1">Order not found</p>
        <p className="text-sm text-gray-400 mb-5">
          Please check your order ID and try again.
        </p>
        <button
          onClick={() => router.push("/track")}
          className="px-5 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 cursor-pointer"
        >
          Back to tracking
        </button>
      </div>
    );
  }

  // Delivered screen
  if (isDelivered && !showDeliveredMap) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-5">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Delivered!</h1>
          <p className="text-gray-400 text-sm">
            Your order has been successfully delivered.
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Order</span>
            <span className="font-mono font-medium">
              #{order?.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Address</span>
            <span className="text-right max-w-[60%]">
              {order?.address.replace(/\s*\[.*?\]\s*/g, "").trim()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Payment</span>
            <span className="uppercase">{order?.payment_method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total</span>
            <span className="font-bold text-sky-600">
              ₱{order?.total.toLocaleString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          Order again <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // Cancelled screen
  if (isCancelled) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">❌</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Order cancelled</h1>
        <p className="text-sm text-gray-400">
          This order has been cancelled. Please place a new order.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors cursor-pointer"
        >
          Back to shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Track your order</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Order #{order?.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Status steps */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-start justify-between relative">
          <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
          <div
            className="absolute top-3.5 left-0 h-0.5 bg-sky-500 z-0 transition-all duration-700"
            style={{
              width:
                currentStepIndex >= 0
                  ? `${(currentStepIndex / (steps.length - 1)) * 100}%`
                  : "0%",
            }}
          />
          {steps.map((step, i) => {
            const Icon = step.icon;
            const done = i <= currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <div
                key={step.key}
                className="flex flex-col items-center z-10 flex-1"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
                  ${done ? "bg-sky-500 text-white" : "bg-gray-100 text-gray-400"}
                  ${active ? "ring-4 ring-sky-100" : ""}`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-xs mt-1.5 text-center leading-tight
                  ${active ? "text-sky-600 font-medium" : "text-gray-400"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status message */}
      {!showMap && isActive && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            {order?.status === "pending" && (
              <Clock size={16} className="text-sky-500" />
            )}
            {order?.status === "confirmed" && (
              <CheckCircle size={16} className="text-sky-500" />
            )}
            {order?.status === "packed" && (
              <Package size={16} className="text-sky-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-800">
              {order?.status === "pending" && "Order received!"}
              {order?.status === "confirmed" && "Order confirmed!"}
              {order?.status === "packed" && "Order is being packed"}
            </p>
            <p className="text-xs text-sky-600 mt-0.5">
              {order?.status === "pending" &&
                "We received your order and will confirm it shortly."}
              {order?.status === "confirmed" &&
                "Your order is confirmed and being prepared."}
              {order?.status === "packed" &&
                "Your order is packed and waiting for a rider."}
            </p>
            <p className="text-xs text-sky-400 mt-1.5">
              The map will appear once a rider picks up your order.
            </p>
          </div>
        </div>
      )}

      {/* Live map — only when on_the_way or just delivered */}
      {showMap && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Live rider location</h2>
            {delivery?.lat ? (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                GPS active
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                Waiting for rider GPS...
              </span>
            )}
          </div>
          <div className="h-72 rounded-xl overflow-hidden bg-sky-50">
            {(() => {
              const match = order?.address?.match(
                /\[(-?\d+\.\d+),(-?\d+\.\d+)\]/,
              );
              const dLat = match ? parseFloat(match[1]) : null;
              const dLng = match ? parseFloat(match[2]) : null;
              return (
                <TrackingMap
                  riderLat={delivery?.lat ?? null}
                  riderLng={delivery?.lng ?? null}
                  destLat={dLat}
                  destLng={dLng}
                />
              );
            })()}
          </div>
          {isDelivered && showDeliveredMap && (
            <p className="text-xs text-center text-gray-400 mt-2">
              Map will hide shortly now that your order is delivered
            </p>
          )}
          {!delivery?.lat && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Map updates automatically once rider starts GPS
            </p>
          )}
        </div>
      )}

      {/* Order info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-sm">Delivery details</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Address</span>
            <span className="text-right max-w-[60%]">
              {order?.address.replace(/\s*\[.*?\]\s*/g, "").trim()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment</span>
            <span className="uppercase">{order?.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="font-semibold text-sky-600">
              ₱{order?.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

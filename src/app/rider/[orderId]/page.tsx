"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation, WifiOff, ArrowLeft } from "lucide-react";
import { showToast } from "@/components/Toast";
import type { Order } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  on_the_way: "bg-sky-100 text-sky-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function RiderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"idle" | "tracking" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !data) {
        setNotFound(true);
        showToast("Order not found. Please check the order ID.", "error");
        return;
      }
      setOrder(data as Order);
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const sendLocation = async (lat: number, lng: number) => {
    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, lat, lng }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Location API error:", data.error);
      }
    } catch (err) {
      console.error("Location send failed:", err);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported on this device.";
      setErrorMsg(msg);
      setStatus("error");
      showToast(msg, "error");
      return;
    }
    setStatus("tracking");
    showToast(
      "GPS tracking started. Customer can now see your location.",
      "success",
    );

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        sendLocation(lat, lng);
      },
      (err) => {
        const msg =
          err.message || "Location error. Please allow location access.";
        setErrorMsg(msg);
        setStatus("error");
        showToast(msg, "error");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setStatus("idle");
    setCoords(null);
    showToast("GPS tracking stopped.", "info");
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-800 mb-1">Order not found</p>
          <p className="text-sm text-gray-400 mb-5">
            The order ID in the URL doesn&apos;t match any order.
          </p>
          <button
            onClick={() => router.push("/rider")}
            className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-medium text-sm hover:bg-sky-600 transition-colors cursor-pointer"
          >
            Back to order list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => {
              stopTracking();
              router.push("/rider");
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} className="text-gray-400" />
          </button>
          <div>
            <p className="font-semibold text-sm">Rider GPS Panel</p>
            <p className="text-xs text-gray-400 font-mono">
              #{orderId?.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="text-3xl ml-auto">🛵</div>
        </div>

        <div className="p-5 space-y-4">
          {order && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Status</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Address</span>
                <span className="text-xs text-right max-w-[60%] truncate">
                  {order.address}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-xs font-semibold text-sky-600">
                  ₱{order.total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {status === "tracking" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                Broadcasting location
              </div>
              {coords && (
                <p className="text-xs text-gray-400 text-center">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">
              <WifiOff size={16} />
              {errorMsg || "Location error"}
            </div>
          )}

          {status !== "tracking" ? (
            <button
              onClick={startTracking}
              className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors cursor-pointer"
            >
              <Navigation size={18} /> Start GPS tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors cursor-pointer"
            >
              Stop tracking
            </button>
          )}

          <p className="text-xs text-gray-300 text-center">
            Keep this page open while delivering
          </p>
        </div>
      </div>
    </div>
  );
}

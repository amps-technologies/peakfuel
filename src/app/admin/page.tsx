"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { cloudinaryUpload } from "@/lib/cloudinary";
import {
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
  ToggleLeft,
  ToggleRight,
  Truck,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { Product, Order, OrderStatus, Category } from "@/types";
import Link from "next/link";
import Image from "next/image";

type AdminTab = "orders" | "products" | "reports" | "rider";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  on_the_way: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const CATEGORY_EMOJI: Record<string, string> = {
  tank: "🛢️",
  refill: "🔄",
  regulator: "🔧",
  accessory: "🔩",
  safety: "🧯",
};

const emptyForm = {
  name: "",
  category: "tank" as Category,
  price: 0,
  unit: "pcs",
  description: "",
  image_url: "",
  in_stock: true,
};

// ── Update this once you upload the APK ──────────────────────
const RIDER_APK_URL =
  "https://github.com/amps-technologies/apk/releases/download/v1.0.0/peakFuelRider.apk";
// ───────────────────────────────────────────────────────────────

function cleanAddress(address: string): string {
  return address.replace(/\s*\[.*?\]\s*/g, "").trim();
}

export default function AdminPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  // Date filter — defaults to today
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
  }, [supabase]);

  const [orderItems, setOrderItems] = useState<
    {
      order_id: string;
      quantity: number;
      unit_price: number;
      product: { name: string; category: string } | null;
    }[]
  >([]);

  const fetchOrderItems = useCallback(async () => {
    const { data } = await supabase
      .from("order_items")
      .select(
        "order_id, quantity, unit_price, product:products(name, category)",
      );
    setOrderItems((data as typeof orderItems) ?? []);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAdminEmail(user?.email ?? "");
      await Promise.all([fetchOrders(), fetchProducts(), fetchOrderItems()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtered orders by date range ──
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at).toISOString().split("T")[0];
      return orderDate >= dateFrom && orderDate <= dateTo;
    });
  }, [orders, dateFrom, dateTo]);

  const reportData = useMemo(() => {
    const inRange = orders.filter((o) => {
      const d = new Date(o.created_at).toISOString().split("T")[0];
      return d >= dateFrom && d <= dateTo && o.status !== "cancelled";
    });

    const totalRevenue = inRange.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = inRange.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const delivered = inRange.filter((o) => o.status === "delivered").length;

    // Revenue by day
    const dayMap: Record<string, number> = {};
    inRange.forEach((o) => {
      const day = new Date(o.created_at).toISOString().split("T")[0];
      dayMap[day] = (dayMap[day] ?? 0) + o.total;
    });
    const days = Object.keys(dayMap).sort();
    const maxDayRevenue = Math.max(...Object.values(dayMap), 1);
    const revenueByDay = days.map((day) => ({
      day,
      revenue: dayMap[day],
      pct: (dayMap[day] / maxDayRevenue) * 100,
    }));

    // Top products
    const inRangeIds = new Set(inRange.map((o) => o.id));
    const productMap: Record<
      string,
      { name: string; qty: number; revenue: number }
    > = {};
    orderItems
      .filter((item) => inRangeIds.has(item.order_id))
      .forEach((item) => {
        const name = item.product?.name ?? "Unknown product";
        if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 };
        productMap[name].qty += item.quantity;
        productMap[name].revenue += item.quantity * item.unit_price;
      });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Payment method breakdown
    const paymentMap: Record<string, number> = {};
    inRange.forEach((o) => {
      paymentMap[o.payment_method] = (paymentMap[o.payment_method] ?? 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      avgOrder,
      delivered,
      revenueByDay,
      topProducts,
      paymentMap,
    };
  }, [orders, orderItems, dateFrom, dateTo]);

  // ── Orders ──
  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
  };

  // ── Products ──
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      in_stock: p.in_stock,
    });
    setImageFile(null);
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) {
      setFormError("Name and price are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      let image_url = form.image_url;
      if (imageFile) {
        image_url = await cloudinaryUpload(imageFile);
      }
      const payload = { ...form, image_url };
      if (editing) {
        await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await fetchProducts();
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleStock = async (p: Product) => {
    await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, in_stock: !p.in_stock }),
    });
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, in_stock: !x.in_stock } : x)),
    );
  };

  const navItems: { key: AdminTab; label: string; icon: typeof ShoppingBag }[] =
    [
      { key: "orders", label: "Orders", icon: ShoppingBag },
      { key: "products", label: "Products", icon: Package },
      { key: "reports", label: "Reports", icon: BarChart3 },
      { key: "rider", label: "Rider app", icon: Truck },
    ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sky-600 font-bold">
            {/* <Flame size={18} /> */}
            <Image src="/logo.png" alt="logo" width={20} height={20} />
            <span>Peak Fuel Admin</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{adminEmail}</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${
                    tab === item.key
                      ? "bg-sky-50 text-sky-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-sky-500 cursor-pointer transition-colors"
          >
            ← Back to shop
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* ── ORDERS TAB ── */}
          {tab === "orders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-800">Orders</h1>
              </div>

              {/* Date filter */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5 shrink-0">
                  <Calendar size={14} className="text-sky-500" />
                  Date range
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                  <span className="text-gray-400 text-sm shrink-0">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    max={today}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => {
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shrink-0"
                >
                  Today
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Orders</p>
                  <p className="text-xl font-bold text-sky-600">
                    {filteredOrders.length}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {
                      filteredOrders.filter((o) => o.status === "pending")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">On the way</p>
                  <p className="text-xl font-bold text-blue-600">
                    {
                      filteredOrders.filter((o) => o.status === "on_the_way")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Delivered</p>
                  <p className="text-xl font-bold text-green-600">
                    {
                      filteredOrders.filter((o) => o.status === "delivered")
                        .length
                    }
                  </p>
                </div>
              </div>

              {/* Orders list */}
              <div className="space-y-2">
                {filteredOrders.length === 0 && (
                  <div className="text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-xl">
                    No orders found for this date range.
                  </div>
                )}
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.guest_name ?? "Registered user"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {cleanAddress(order.address)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-sky-600">
                        ₱{order.total.toLocaleString()}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="packed">packed</option>
                        <option value="on_the_way">on the way</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <a
                        href={`/track/${order.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-500 hover:underline cursor-pointer"
                      >
                        Track
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ── */}
          {tab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-800">
                  Products
                </h1>
                <button
                  onClick={openNew}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 cursor-pointer transition-colors"
                >
                  <Plus size={15} />
                  Add product
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                  >
                    <div className="h-24 bg-sky-50 flex items-center justify-center text-4xl">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (CATEGORY_EMOJI[p.category] ?? "📦")
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {p.category} · ₱{p.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleStock(p)}
                            title="Toggle stock"
                            className="cursor-pointer"
                          >
                            {p.in_stock ? (
                              <ToggleRight
                                size={18}
                                className="text-green-500"
                              />
                            ) : (
                              <ToggleLeft size={18} className="text-gray-300" />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <Pencil size={14} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORTS TAB ── */}
          {tab === "reports" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-800">
                  Sales report
                </h1>
              </div>

              {/* Date filter — reuses the same range */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5 shrink-0">
                  <Calendar size={14} className="text-sky-500" />
                  Date range
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                  <span className="text-gray-400 text-sm shrink-0">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    max={today}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => {
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shrink-0"
                >
                  Today
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Total revenue</p>
                  <p className="text-xl font-bold text-sky-600">
                    ₱{reportData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Total orders</p>
                  <p className="text-xl font-bold text-gray-800">
                    {reportData.totalOrders}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Avg order value</p>
                  <p className="text-xl font-bold text-gray-800">
                    ₱{Math.round(reportData.avgOrder).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Delivered</p>
                  <p className="text-xl font-bold text-green-600">
                    {reportData.delivered}
                  </p>
                </div>
              </div>

              {/* Revenue by day chart */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Revenue by day
                </h2>
                {reportData.revenueByDay.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No revenue data for this range.
                  </p>
                ) : (
                  <div className="flex items-end gap-1.5 h-32">
                    {reportData.revenueByDay.map((d) => (
                      <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center justify-end gap-1 group relative"
                      >
                        <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 whitespace-nowrap">
                          ₱{d.revenue.toLocaleString()}
                        </div>
                        <div
                          className="w-full bg-sky-400 hover:bg-sky-500 rounded-t transition-colors cursor-default"
                          style={{ height: `${Math.max(d.pct, 4)}%` }}
                        />
                        <span className="text-[10px] text-gray-400">
                          {new Date(d.day).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top products */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Top selling products
                </h2>
                {reportData.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No product sales for this range.
                  </p>
                ) : (
                  <div className="space-y-0">
                    {reportData.topProducts.map((p, i) => (
                      <div
                        key={p.name}
                        className={`flex items-center justify-between py-2.5 ${
                          i !== reportData.topProducts.length - 1
                            ? "border-b border-gray-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-300 w-4 shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 truncate">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-medium text-gray-800">
                            ₱{p.revenue.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {p.qty} sold
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment method breakdown */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Payment methods
                </h2>
                {Object.keys(reportData.paymentMap).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No payment data for this range.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(reportData.paymentMap).map(
                      ([method, count]) => (
                        <div
                          key={method}
                          className="bg-gray-50 rounded-lg p-3 text-center"
                        >
                          <p className="text-lg font-bold text-gray-800">
                            {count}
                          </p>
                          <p className="text-xs text-gray-400 uppercase mt-0.5">
                            {method}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RIDER APP TAB ── */}
          {tab === "rider" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold text-gray-800">Rider app</h1>

              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      🛵
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Rider app (Android)
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Distribute to your delivery riders · Android only · v1.0
                      </p>
                    </div>
                  </div>
                  <a
                    href={RIDER_APK_URL}
                    download="GasGo-Rider-v1.0.apk"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium text-sm hover:bg-sky-600 transition-colors cursor-pointer shrink-0 justify-center"
                  >
                    <Truck size={15} /> Download Rider APK
                  </a>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-sky-700 mb-2">
                    📋 Installation instructions for riders
                  </p>
                  <ol className="text-xs text-sky-700 space-y-1 list-decimal list-inside">
                    <li>Open the download link on your Android phone</li>
                    <li>
                      Tap <strong>Download</strong> and wait for it to finish
                    </li>
                    <li>
                      Open the downloaded file from notifications or Downloads
                      folder
                    </li>
                    <li>
                      If prompted, tap{" "}
                      <strong>Settings → Allow from this source</strong>
                    </li>
                    <li>
                      Tap <strong>Install</strong> then <strong>Open</strong>
                    </li>
                    <li>
                      Sign in with the username and password provided by admin
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── PRODUCT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-8">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-semibold">
                {editing ? "Edit product" : "Add product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Image upload */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Product image
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center text-3xl overflow-hidden shrink-0">
                    {imageFile ? (
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt=""
                        className="w-full h-full object-cover object-center"
                      />
                    ) : form.image_url ? (
                      <img
                        src={form.image_url}
                        alt=""
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      (CATEGORY_EMOJI[form.category] ?? "📦")
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                    <Upload size={14} />
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Product name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="11kg LPG Tank"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as Category,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  >
                    <option value="tank">🛢️ tank</option>
                    <option value="refill">🔄 refill</option>
                    <option value="regulator">🔧 regulator</option>
                    <option value="accessory">🔩 accessory</option>
                    <option value="safety">🧯 safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Unit
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  >
                    <option value="pcs">pcs</option>
                    <option value="cylinder">cylinder</option>
                    <option value="refill">refill</option>
                    <option value="pack">pack</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Price (₱) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short product description..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="in_stock"
                  checked={form.in_stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, in_stock: e.target.checked }))
                  }
                  className="accent-sky-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="in_stock"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  In stock
                </label>
              </div>

              {formError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check size={15} />
                      {editing ? "Save changes" : "Add product"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

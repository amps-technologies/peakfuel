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
  Flame,
  BarChart3,
  ArrowLeft,
  Search,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Product, Order, OrderStatus, Category } from "@/types";
import { showToast } from "@/components/Toast";
import Link from "next/link";

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

const CATEGORY_ORDER = ["tank", "refill", "regulator", "accessory", "safety"];

const RIDER_APK_URL =
  "https://github.com/yourusername/gasgo-releases/releases/download/v1.0.0/gasgo-rider.apk";

interface FormState {
  name: string;
  category: Category;
  price: number;
  unit: string;
  description: string;
  image_url: string;
  in_stock: boolean;
}

const emptyForm: FormState = {
  name: "",
  category: "tank",
  price: 0,
  unit: "pcs",
  description: "",
  image_url: "",
  in_stock: true,
};

function cleanAddress(address: string): string {
  return address.replace(/\s*\[.*?\]\s*/g, "").trim();
}

interface OrderItemRow {
  order_id: string;
  quantity: number;
  unit_price: number;
  product: { name: string; category: string } | null;
}

interface OrderItemRaw {
  order_id: string;
  quantity: number;
  unit_price: number;
  product:
    | { name: string; category: string }[]
    | { name: string; category: string }
    | null;
}

export default function AdminPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  // Date filter
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  // Product search/filter
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");

  // Sort mode
  const [sortMode, setSortMode] = useState(false);
  const [sortedList, setSortedList] = useState<Product[]>([]);
  const [savingSort, setSavingSort] = useState(false);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Data fetching ──────────────────────────────────────────
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
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
    setSortedList((data as Product[]) ?? []);
  }, [supabase]);

  const fetchOrderItems = useCallback(async () => {
    const { data } = await supabase
      .from("order_items")
      .select(
        "order_id, quantity, unit_price, product:products(name, category)",
      );

    const normalized: OrderItemRow[] = ((data as OrderItemRaw[]) ?? []).map(
      (item) => ({
        order_id: item.order_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product: Array.isArray(item.product)
          ? (item.product[0] ?? null)
          : item.product,
      }),
    );
    setOrderItems(normalized);
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

  // ── Derived data ───────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at).toISOString().split("T")[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [orders, dateFrom, dateTo]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = productCategory === "" || p.category === productCategory;
      const matchSearch =
        productSearch.trim() === "" ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, productCategory, productSearch]);

  const reportData = useMemo(() => {
    const inRange = orders.filter((o) => {
      const d = new Date(o.created_at).toISOString().split("T")[0];
      return d >= dateFrom && d <= dateTo && o.status !== "cancelled";
    });
    const totalRevenue = inRange.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = inRange.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const delivered = inRange.filter((o) => o.status === "delivered").length;

    const dayMap: Record<string, number> = {};
    inRange.forEach((o) => {
      const day = new Date(o.created_at).toISOString().split("T")[0];
      dayMap[day] = (dayMap[day] ?? 0) + o.total;
    });
    const days = Object.keys(dayMap).sort();
    const maxDay = Math.max(...Object.values(dayMap), 1);
    const revenueByDay = days.map((day) => ({
      day,
      revenue: dayMap[day],
      pct: (dayMap[day] / maxDay) * 100,
    }));

    const inRangeIds = new Set(inRange.map((o) => o.id));
    const productMap: Record<
      string,
      { name: string; qty: number; revenue: number }
    > = {};
    orderItems
      .filter((item) => inRangeIds.has(item.order_id))
      .forEach((item) => {
        const name = item.product?.name ?? "Unknown";
        if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 };
        productMap[name].qty += item.quantity;
        productMap[name].revenue += item.quantity * item.unit_price;
      });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

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

  // ── Orders ─────────────────────────────────────────────────
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

  // ── Products CRUD ──────────────────────────────────────────
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
      category: p.category as Category,
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
      if (imageFile) image_url = await cloudinaryUpload(imageFile);
      const payload = { ...form, image_url };
      if (editing) {
        await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        showToast(`"${form.name}" updated successfully`, "success");
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast(`"${form.name}" added successfully`, "success");
      }
      await fetchProducts();
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (p: Product) => {
    setDeleteTarget(p);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSortedList((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteModalOpen(false);
      showToast(`"${deleteTarget.name}" deleted`, "success");
      setDeleteTarget(null);
    } catch {
      showToast("Failed to delete product. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
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

  // ── Sort mode ──────────────────────────────────────────────
  const moveSortItem = (fromIdx: number, toIdx: number) => {
    const newList = [...sortedList];
    [newList[fromIdx], newList[toIdx]] = [newList[toIdx], newList[fromIdx]];
    setSortedList(newList);
  };

  const saveSort = async () => {
    setSavingSort(true);
    try {
      const updates: { id: string; sort_order: number }[] = [];
      CATEGORY_ORDER.forEach((cat) => {
        const catItems = sortedList.filter((p) => p.category === cat);
        catItems.forEach((p, i) => {
          updates.push({ id: p.id, sort_order: i + 1 });
        });
      });
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          fetch("/api/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, sort_order }),
          }),
        ),
      );
      await fetchProducts();
      setSortMode(false);
      showToast("Product order saved", "success");
    } finally {
      setSavingSort(false);
    }
  };

  const cancelSort = () => {
    setSortedList([...products]);
    setSortMode(false);
  };

  // ── Nav ────────────────────────────────────────────────────
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
      {/* ── SIDEBAR ── */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sky-600 font-bold">
            <Flame size={18} />
            <span>Admin</span>
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
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-sky-500 cursor-pointer transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Back to store
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* ══ ORDERS TAB ══ */}
          {tab === "orders" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold text-gray-800">Orders</h1>

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
                    max={dateTo}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                  <span className="text-gray-400 text-sm shrink-0">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    max={today}
                    onChange={(e) => setDateTo(e.target.value)}
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
                {[
                  {
                    label: "Orders",
                    value: filteredOrders.length,
                    color: "text-sky-600",
                  },
                  {
                    label: "Pending",
                    value: filteredOrders.filter((o) => o.status === "pending")
                      .length,
                    color: "text-yellow-600",
                  },
                  {
                    label: "On the way",
                    value: filteredOrders.filter(
                      (o) => o.status === "on_the_way",
                    ).length,
                    color: "text-blue-600",
                  },
                  {
                    label: "Delivered",
                    value: filteredOrders.filter(
                      (o) => o.status === "delivered",
                    ).length,
                    color: "text-green-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white border border-gray-100 rounded-xl p-3"
                  >
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
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
                        {[
                          "pending",
                          "confirmed",
                          "packed",
                          "on_the_way",
                          "delivered",
                          "cancelled",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
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

          {/* ══ PRODUCTS TAB ══ */}
          {tab === "products" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-lg font-semibold text-gray-800 shrink-0">
                  Products
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {filteredProducts.length}/{products.length}
                  </span>
                </h1>
                <div className="flex items-center gap-2">
                  {!sortMode ? (
                    <>
                      <button
                        onClick={() => {
                          setSortMode(true);
                          setSortedList([...products]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-gray-600"
                      >
                        <GripVertical size={14} />
                        Arrange
                      </button>
                      <button
                        onClick={openNew}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 cursor-pointer transition-colors"
                      >
                        <Plus size={15} />
                        Add product
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={cancelSort}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveSort}
                        disabled={savingSort}
                        className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 cursor-pointer disabled:opacity-60"
                      >
                        <Check size={14} />
                        {savingSort ? "Saving..." : "Save order"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── SORT MODE ── */}
              {sortMode ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400">
                    Arrange products within each category using the arrows.
                    Category order is fixed: Tanks → Refills → Regulators →
                    Accessories → Safety.
                  </p>

                  {CATEGORY_ORDER.map((cat) => {
                    const catItems = sortedList.filter(
                      (p) => p.category === cat,
                    );
                    if (catItems.length === 0) return null;
                    return (
                      <div
                        key={cat}
                        className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                      >
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                          <span className="text-sm">{CATEGORY_EMOJI[cat]}</span>
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {cat}s
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {catItems.length} item
                            {catItems.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {catItems.map((p, catIdx) => {
                            const globalIdx = sortedList.findIndex(
                              (x) => x.id === p.id,
                            );
                            return (
                              <div
                                key={p.id}
                                className="px-4 py-3 flex items-center gap-3"
                              >
                                <span className="w-5 text-xs font-semibold text-gray-300 shrink-0 text-center">
                                  {catIdx + 1}
                                </span>
                                <GripVertical
                                  size={15}
                                  className="text-gray-200 shrink-0"
                                />
                                <div className="w-10 h-10 bg-sky-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  ) : (
                                    <span className="text-base">
                                      {CATEGORY_EMOJI[p.category] ?? "📦"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    ₱{p.price.toLocaleString()}
                                    {!p.in_stock && (
                                      <span className="ml-2 text-red-400">
                                        · out of stock
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    onClick={() => {
                                      if (catIdx === 0) return;
                                      const prevGlobalIdx =
                                        sortedList.findIndex(
                                          (x) =>
                                            x.id === catItems[catIdx - 1].id,
                                        );
                                      moveSortItem(globalIdx, prevGlobalIdx);
                                    }}
                                    disabled={catIdx === 0}
                                    className="p-1 hover:bg-gray-100 rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (catIdx === catItems.length - 1)
                                        return;
                                      const nextGlobalIdx =
                                        sortedList.findIndex(
                                          (x) =>
                                            x.id === catItems[catIdx + 1].id,
                                        );
                                      moveSortItem(globalIdx, nextGlobalIdx);
                                    }}
                                    disabled={catIdx === catItems.length - 1}
                                    className="p-1 hover:bg-gray-100 rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── NORMAL PRODUCT LIST ── */
                <>
                  {/* Search + category filter */}
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <div className="relative flex-1">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                      />
                      {productSearch && (
                        <button
                          onClick={() => setProductSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer bg-white text-gray-700"
                    >
                      <option value="">All categories</option>
                      <option value="tank">🛢️ Tanks</option>
                      <option value="refill">🔄 Refills</option>
                      <option value="regulator">🔧 Regulators</option>
                      <option value="accessory">🔩 Accessories</option>
                      <option value="safety">🧯 Safety</option>
                    </select>
                  </div>

                  {/* Empty state */}
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-xl">
                      <p className="text-3xl mb-2">🔍</p>
                      <p className="text-sm">
                        {products.length === 0
                          ? "No products yet. Add your first product!"
                          : "No products match your search."}
                      </p>
                      {(productSearch || productCategory) && (
                        <button
                          onClick={() => {
                            setProductSearch("");
                            setProductCategory("");
                          }}
                          className="mt-3 text-xs text-sky-500 hover:underline cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                        >
                          <div className="aspect-square bg-sky-50 flex items-center justify-center overflow-hidden relative">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <img
                                  src="/logo.png"
                                  alt="placeholder"
                                  className="w-10 h-10 object-contain opacity-20"
                                />
                                <span className="text-[10px] text-gray-300">
                                  No image
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {p.name}
                                </p>
                                <p className="text-xs text-gray-400 capitalize mt-0.5">
                                  {p.category} · ₱{p.price.toLocaleString()} · #
                                  {p.sort_order ?? 99}
                                </p>
                                <span
                                  className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium
                                  ${p.in_stock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}
                                >
                                  {p.in_stock ? "In stock" : "Out of stock"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => toggleStock(p)}
                                  title="Toggle stock"
                                  className="cursor-pointer p-1 rounded hover:bg-gray-100"
                                >
                                  {p.in_stock ? (
                                    <ToggleRight
                                      size={18}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <ToggleLeft
                                      size={18}
                                      className="text-gray-300"
                                    />
                                  )}
                                </button>
                                <button
                                  onClick={() => openEdit(p)}
                                  className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                  <Pencil size={14} className="text-gray-400" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(p)}
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
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ REPORTS TAB ══ */}
          {tab === "reports" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold text-gray-800">
                Sales report
              </h1>

              <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5 shrink-0">
                  <Calendar size={14} className="text-sky-500" /> Date range
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                  <span className="text-gray-400 text-sm shrink-0">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    max={today}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => {
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer shrink-0"
                >
                  Today
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Total revenue",
                    value: `₱${reportData.totalRevenue.toLocaleString()}`,
                    color: "text-sky-600",
                  },
                  {
                    label: "Total orders",
                    value: reportData.totalOrders,
                    color: "text-gray-800",
                  },
                  {
                    label: "Avg order value",
                    value: `₱${Math.round(reportData.avgOrder).toLocaleString()}`,
                    color: "text-gray-800",
                  },
                  {
                    label: "Delivered",
                    value: reportData.delivered,
                    color: "text-green-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white border border-gray-100 rounded-xl p-3"
                  >
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Revenue by day
                </h2>
                {reportData.revenueByDay.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No revenue data for this range.
                  </p>
                ) : (
                  <div
                    className="flex items-end gap-1.5"
                    style={{ height: "140px" }}
                  >
                    {reportData.revenueByDay.map((d) => {
                      const barH = Math.max((d.pct / 100) * 110, 6);
                      return (
                        <div
                          key={d.day}
                          className="flex-1 flex flex-col items-center justify-end gap-1 group relative h-full"
                        >
                          <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 whitespace-nowrap bg-white px-1 rounded shadow-sm z-10">
                            ₱{d.revenue.toLocaleString()}
                          </div>
                          <div
                            className="w-full bg-sky-400 hover:bg-sky-500 rounded-t transition-colors cursor-default"
                            style={{ height: `${barH}px` }}
                          />
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(d.day).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Top selling products
                </h2>
                {reportData.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No product sales for this range.
                  </p>
                ) : (
                  <div>
                    {reportData.topProducts.map((p, i) => (
                      <div
                        key={p.name}
                        className={`flex items-center justify-between py-2.5 ${i !== reportData.topProducts.length - 1 ? "border-b border-gray-50" : ""}`}
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

          {/* ══ RIDER TAB ══ */}
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

      {/* ══ PRODUCT MODAL ══ */}
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
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {imageFile ? (
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt=""
                        className="w-full h-full object-contain p-1"
                      />
                    ) : form.image_url ? (
                      <img
                        src={form.image_url}
                        alt=""
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <img
                        src="/logo.png"
                        alt="placeholder"
                        className="w-8 h-8 object-contain opacity-20"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50 w-fit">
                      <Upload size={14} /> Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                      Recommended:{" "}
                      <strong className="text-gray-500">800 × 800 px</strong>{" "}
                      square, JPG or PNG.
                      <br />
                      Cloudinary will auto-crop to square on upload.
                    </p>
                  </div>
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
                    <option value="tank">🛢️ Tank</option>
                    <option value="refill">🔄 Refill</option>
                    <option value="regulator">🔧 Regulator</option>
                    <option value="accessory">🔩 Accessory</option>
                    <option value="safety">🧯 Safety</option>
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
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
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

      {/* ══ DELETE CONFIRMATION MODAL ══ */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h2 className="font-semibold text-gray-900 text-base">
                Delete product?
              </h2>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-medium text-gray-700">
                  &quot;{deleteTarget.name}&quot;
                </span>
                ? This cannot be undone.
              </p>
            </div>

            {/* Product preview */}
            <div className="mx-6 mb-5 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                {deleteTarget.image_url ? (
                  <img
                    src={deleteTarget.image_url}
                    alt={deleteTarget.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-xl">
                    {CATEGORY_EMOJI[deleteTarget.category] ?? "📦"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {deleteTarget.name}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {deleteTarget.category} · ₱
                  {deleteTarget.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteTarget(null);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 cursor-pointer disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

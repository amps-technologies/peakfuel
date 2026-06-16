"use client";
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import type { Product, Order, OrderStatus, Category } from "@/types";
import Image from "next/image";

type AdminTab = "orders" | "products";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  on_the_way: "bg-sky-100 text-sky-700",
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

export default function AdminPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchOrders(), fetchProducts()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Stats */}
      {/* Rider App Download */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🛵
          </div>
          <div>
            <p className="font-semibold text-gray-800">Rider App (Android)</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Share this APK with your delivery riders to install on their
              Android phones test
            </p>
          </div>
        </div>
        <a
          href="https://github.com/amps-technologies/apk/releases/download/v1.0.0/peakFuelRider.apk"
          download
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium text-sm hover:bg-sky-600 transition-colors cursor-pointer shrink-0 justify-center"
        >
          ⬇️ Download Rider APK
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total orders</p>
          <p className="text-2xl font-bold text-sky-600">{orders.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">On the way</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter((o) => o.status === "on_the_way").length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Products</p>
          <p className="text-2xl font-bold text-green-600">{products.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6">
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "orders"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <ShoppingBag size={15} />
          Orders
        </button>
        <button
          onClick={() => setTab("products")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "products"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Package size={15} />
          Products
        </button>
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No orders yet.
            </div>
          )}
          {orders.map((order) => (
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
                  {order.address.replace(/\s*\[.*?\]\s*/g, "").trim()}
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
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                  className="text-xs text-sky-500 hover:underline"
                >
                  Track
                </a>
                <a
                  href="/rider"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Rider panel
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products tab */}
      {tab === "products" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600"
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
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (CATEGORY_EMOJI[p.category] ?? "📦")
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {p.category} · ₱{p.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleStock(p)}
                        title="Toggle stock"
                      >
                        {p.in_stock ? (
                          <ToggleRight size={18} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={18} className="text-gray-300" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Pencil size={14} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 hover:bg-red-50 rounded"
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

      {/* Product modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold">
                {editing ? "Edit product" : "Add product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
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
                        className="w-full h-full object-cover"
                      />
                    ) : form.image_url ? (
                      <Image
                        src={form.image_url}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
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

              {/* Name */}
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

              {/* Category + Unit */}
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
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="pcs">pcs</option>
                    <option value="cylinder">cylinder</option>
                    <option value="refill">refill</option>
                    <option value="pack">pack</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>

              {/* Price */}
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

              {/* Description */}
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

              {/* In stock */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="in_stock"
                  checked={form.in_stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, in_stock: e.target.checked }))
                  }
                  className="accent-sky-500 w-4 h-4"
                />
                <label htmlFor="in_stock" className="text-sm text-gray-600">
                  In stock
                </label>
              </div>

              {/* Error */}
              {formError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {formError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-60 flex items-center justify-center gap-2"
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

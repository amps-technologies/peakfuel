import { create } from "zustand";
import type { Product } from "@/types";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  userId: string | null;
  setUserId: (id: string | null) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  setCartOpen: (open: boolean) => void;
}

const storageKey = (id: string) => `gasgo_cart_${id}`;

const load = (userId: string): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const save = (userId: string, items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {}
};

const remove = (userId: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {}
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isCartOpen: false,
  userId: null,

  setUserId: (id) => {
    const prev = get().userId;
    if (id === prev) return;

    if (id) {
      // User logged in — restore their saved cart
      const saved = load(id);
      set({ userId: id, items: saved });
    } else {
      // User logged out — wipe memory, keep localStorage intact
      set({ userId: null, items: [] });
    }
  },

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      const newItems = existing
        ? state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [...state.items, { product, quantity }];

      if (state.userId) save(state.userId, newItems);
      return { items: newItems };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.product.id !== productId);
      if (state.userId) save(state.userId, newItems);
      return { items: newItems };
    });
  },

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => {
      const newItems = state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i,
      );
      if (state.userId) save(state.userId, newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    const { userId } = get();
    if (userId) remove(userId);
    set({ items: [] });
  },

  total: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  setCartOpen: (open) => set({ isCartOpen: open }),
}));

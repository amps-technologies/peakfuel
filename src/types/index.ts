export type Category = "tank" | "refill" | "regulator" | "accessory" | "safety";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "on_the_way"
  | "delivered"
  | "cancelled";
export type PaymentMethod = "cod" | "gcash" | "maya" | "card";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string | null;
  image_url: string | null;
  in_stock: boolean;
  created_at: string;
  sort_order: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  status: OrderStatus;
  address: string;
  payment_method: PaymentMethod;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Delivery {
  id: string;
  order_id: string;
  rider_id: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

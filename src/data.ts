import { translate, type Locale } from "./locales";

export type OrderItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type Row = {
  id: string;
  name: string;
  email?: string;
  status: string;
  read?: boolean;
  reason?: string;
  note?: string;
  delta?: number;
  at?: string;
  kind?: string;
  minimum?: number;
  limit?: number;
  used?: number;
  startsAt?: string;
  expiresAt?: string;
  code?: string;
  sku?: string;
  imageKey?: string;
  productId?: string;
  paymentStatus?: string;
  productName?: string;
  customerId?: string;
  items?: OrderItem[];
  historyType?: "fulfillment" | "payment";
  quantity?: number;
  shipping?: number;
  tax?: number;
  registeredAt?: string;
  phone?: string;
  description?: string;
  address?: string;
  tags?: string;
  price?: number;
  stock?: number;
  threshold?: number;
  category?: string;
  date?: string;
};
export const initial: Record<string, Row[]> = {
  Products: Array.from({ length: 60 }, (_, i) => ({
    id: `SKU-${2100 + i}`,
    name: [
      "AirPods Pro",
      "Minimalist Watch",
      "Everyday Backpack",
      "Ceramic Coffee Set",
      "Wireless Charger",
    ][i % 5],
    category: ["Electronics", "Accessories", "Bags", "Home & Living"][i % 4],
    imageKey: ["headphones", "watch", "backpack", "coffee", "charger"][i % 5],
    price: [249, 189, 79, 42][i % 4],
    stock: [42, 8, 0, 126, 19][i % 5],
    status: i % 7 === 0 ? "Draft" : "Active",
  })),
  Categories: [
    "Electronics",
    "Accessories",
    "Bags",
    "Home & Living",
    "Clothing",
    "Beauty",
    "Sports",
    "Books",
    "Food & Drink",
    "Stationery",
  ].map((name, i) => ({
    id: `CAT-${100 + i}`,
    name,
    status: i === 7 ? "Inactive" : "Active",
  })),
  Orders: Array.from({ length: 60 }, (_, i) => {
    const customerNames = [
      "Olivia Rhye",
      "Phoenix Baker",
      "Lana Steiner",
      "Demi Wilkinson",
    ];
    const productNames = [
      "AirPods Pro",
      "Minimalist Watch",
      "Everyday Backpack",
      "Ceramic Coffee Set",
      "Wireless Charger",
    ];
    const items: OrderItem[] = Array.from({ length: 1 + (i % 3) }, (_, j) => {
      const productIndex = (i + j * 7) % 60;
      return {
        productId: `SKU-${2100 + productIndex}`,
        productName: productNames[productIndex % productNames.length],
        sku: `SKU-${2100 + productIndex}`,
        quantity: 1 + ((i + j) % 3),
        unitPrice: [249, 189, 79, 42][productIndex % 4],
      };
    });
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const shipping = 5;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const firstItem = items[0];
    return {
      id: `ORD-${7841 - i}`,
      customerId: `CUS-${1001 + (i % 36)}`,
      name: customerNames[i % customerNames.length],
      email: "customer@example.com",
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      status: ["Delivered", "Processing", "Pending", "Shipped"][i % 4],
      paymentStatus:
        i % 17 === 0 ? "Refunded" : i % 5 === 0 ? "Pending" : "Paid",
      items,
      productId: firstItem.productId,
      productName: firstItem.productName,
      sku: firstItem.sku,
      quantity: firstItem.quantity,
      shipping,
      tax,
      address: `${100 + i} Market Street, London, UK`,
      price: subtotal + shipping + tax,
    };
  }),
  Customers: Array.from({ length: 36 }, (_, i) => ({
    id: `CUS-${1001 + i}`,
    name: ["Olivia Rhye", "Phoenix Baker", "Lana Steiner", "Demi Wilkinson"][
      i % 4
    ],
    email: [
      "olivia@example.com",
      "phoenix@example.com",
      "lana@example.com",
      "demi@example.com",
    ][i % 4],
    status: i % 6 ? "Active" : "Inactive",
    price: 120 + i * 21,
    registeredAt: new Date(Date.now() - (i + 40) * 86400000).toISOString(),
    phone: `+44 20 7946 ${String(1000 + i).padStart(4, "0")}`,
    address: `${20 + i} High Street, London, UK`,
    date: "May 12, 2024",
  })),
  Inventory: Array.from({ length: 60 }, (_, i) => ({
    id: `SKU-${2100 + i}`,
    name: [
      "AirPods Pro",
      "Minimalist Watch",
      "Everyday Backpack",
      "Ceramic Coffee Set",
      "Wireless Charger",
    ][i % 5],
    stock: [42, 8, 0, 126, 19][i % 5],
    threshold: 10,
    status:
      [42, 8, 0, 126, 19][i % 5] === 0
        ? "Out of stock"
        : [42, 8, 0, 126, 19][i % 5] <= 10
          ? "Low stock"
          : "In stock",
  })),
  OrderHistory: [
    {
      id: "H-01",
      name: "ORD-7841",
      status: "Delivered",
      date: "May 30, 2024",
      note: "Delivered to customer",
    },
    {
      id: "H-02",
      name: "ORD-7840",
      status: "Processing",
      date: "May 30, 2024",
      note: "Order packed",
    },
  ],
  InventoryMovements: [
    {
      id: "MOV-01",
      status: "Recorded",
      name: "AirPods Pro",
      delta: 12,
      reason: "Restock delivery",
      date: "Today",
    },
    {
      id: "MOV-02",
      status: "Recorded",
      name: "Minimalist Watch",
      delta: -2,
      reason: "Damaged item",
      date: "Yesterday",
    },
  ],
  Notifications: [
    {
      id: "NOT-01",
      name: "Order ORD-7841 was delivered",
      status: "Unread",
      date: "Today",
    },
    {
      id: "NOT-02",
      name: "Stock is running low: Minimalist Watch",
      status: "Unread",
      date: "Today",
    },
    {
      id: "NOT-03",
      name: "New order ORD-7840 received",
      status: "Read",
      date: "Yesterday",
    },
  ],
  Promotions: [
    {
      id: "SAVE20",
      name: "Summer Sale",
      code: "SAVE20",
      kind: "percent",
      status: "Active",
      price: 20,
      minimum: 5000,
      limit: 500,
      used: 128,
      startsAt: "2024-05-01",
      expiresAt: "2027-06-30",
      date: "Jun 30, 2027",
    },
    {
      id: "WELCOME10",
      name: "Welcome offer",
      code: "WELCOME10",
      kind: "percent",
      status: "Active",
      price: 10,
      minimum: 0,
      limit: 1000,
      used: 341,
      startsAt: "2024-01-01",
      expiresAt: "2027-12-31",
      date: "Dec 31, 2027",
    },
    {
      id: "FREESHIP",
      name: "Free shipping",
      code: "FREESHIP",
      kind: "fixed",
      status: "Scheduled",
      price: 5,
      minimum: 2500,
      limit: 250,
      used: 0,
      startsAt: "2027-08-01",
      expiresAt: "2027-08-31",
      date: "Aug 31, 2027",
    },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `DEAL${i + 1}`,
      name: `Seasonal deal ${i + 1}`,
      code: `DEAL${i + 1}`,
      kind: i % 2 ? "fixed" : "percent",
      status: "Active",
      price: 5 + i,
      minimum: 2500,
      limit: 300,
      used: i * 11,
      startsAt: "2026-01-01",
      expiresAt: "2027-12-31",
      date: "Dec 31, 2027",
    })),
  ],
};
export function formatMoney(value: number | undefined, lang: Locale) {
  return new Intl.NumberFormat(lang === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}
export function formatDate(value: string | undefined, lang: Locale) {
  if (!value) return "—";
  if (value === "Today" || value === "Yesterday") return translate(lang, value);
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
}
export function promotionStatus(r: Row) {
  if (r.status === "Inactive") return "Inactive";
  if (r.limit && r.used !== undefined && r.used >= r.limit) return "Exhausted";
  const now = Date.now();
  if (r.startsAt && now < new Date(r.startsAt).getTime()) return "Scheduled";
  if (r.expiresAt && now > new Date(r.expiresAt + "T23:59:59").getTime())
    return "Expired";
  return "Active";
}

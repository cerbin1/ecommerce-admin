/** Shared domain model and business rules for the Shopflow demo. */
export type Status =
  | "active"
  | "draft"
  | "archived"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}
export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  priceCents: number;
  compareAtPriceCents?: number;
  status: "active" | "draft" | "archived";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: string;
  active: boolean;
}
export interface OrderLine {
  productId: string;
  nameSnapshot: string;
  skuSnapshot: string;
  unitPriceCents: number;
  quantity: number;
}
export interface Order {
  id: string;
  number: string;
  customerId: string;
  createdAt: string;
  paymentStatus: "pending" | "paid" | "refunded";
  fulfillmentStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  lines: OrderLine[];
  shippingCents: number;
  taxCents: number;
  history: { status: string; at: string; note: string }[];
}
export interface InventoryLevel {
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
}
export interface InventoryMovement {
  id: string;
  productId: string;
  delta: number;
  resultingQuantity: number;
  reason: string;
  at: string;
}
export interface Promotion {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minimumOrderCents: number;
  startsAt: string;
  expiresAt: string;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
}
export interface BusinessData {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  inventory: InventoryLevel[];
  movements: InventoryMovement[];
  promotions: Promotion[];
}
export const money = (cents: number, locale = "en-GB") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export const orderTotal = (o: Order) =>
  o.lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0) +
  o.shippingCents +
  o.taxCents;
export function categoryCounts(data: BusinessData) {
  return Object.fromEntries(
    data.categories.map((c) => [
      c.id,
      data.products.filter(
        (p) => p.categoryId === c.id && p.status !== "archived",
      ).length,
    ]),
  );
}
export function customerSummary(data: BusinessData, customerId: string) {
  const orders = data.orders.filter(
    (o) => o.customerId === customerId && o.paymentStatus === "paid",
  );
  const spend = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  return {
    orders: orders.length,
    spendCents: spend,
    averageCents: orders.length ? Math.round(spend / orders.length) : 0,
    history: data.orders
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
export function dashboardSummary(data: BusinessData, now = new Date()) {
  const since = new Date(now);
  since.setDate(since.getDate() - 30);
  const recent = data.orders.filter((o) => new Date(o.createdAt) >= since);
  const paid = recent.filter((o) => o.paymentStatus === "paid");
  const revenue = paid.reduce((n, o) => n + orderTotal(o), 0);
  const lowStock = data.inventory.filter(
    (i) => i.quantity <= i.lowStockThreshold,
  );
  const counts = new Map<string, number>();
  for (const o of paid)
    for (const line of o.lines)
      counts.set(
        line.productId,
        (counts.get(line.productId) || 0) + line.quantity,
      );
  const topProducts = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, sold]) => ({
      product: data.products.find((p) => p.id === id),
      sold,
    }));
  return {
    revenueCents: revenue,
    orderCount: recent.length,
    lowStock,
    topProducts,
    recentOrders: [...data.orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
  };
}
export function removeProduct(
  data: BusinessData,
  productId: string,
): BusinessData {
  if (data.orders.some((o) => o.lines.some((l) => l.productId === productId)))
    throw new Error("PRODUCT_REFERENCED");
  return {
    ...data,
    products: data.products.filter((p) => p.id !== productId),
    inventory: data.inventory.filter((i) => i.productId !== productId),
    movements: data.movements.filter((m) => m.productId !== productId),
  };
}
export function removeCategory(
  data: BusinessData,
  categoryId: string,
): BusinessData {
  if (data.products.some((p) => p.categoryId === categoryId))
    throw new Error("CATEGORY_IN_USE");
  return {
    ...data,
    categories: data.categories.filter((c) => c.id !== categoryId),
  };
}
export function adjustStock(
  data: BusinessData,
  productId: string,
  delta: number,
  reason: string,
  at = new Date().toISOString(),
): BusinessData {
  if (!Number.isInteger(delta) || delta === 0 || !reason.trim())
    throw new Error("INVALID_ADJUSTMENT");
  const old = data.inventory.find((i) => i.productId === productId);
  if (!old) throw new Error("INVENTORY_NOT_FOUND");
  const quantity = old.quantity + delta;
  if (quantity < 0) throw new Error("INSUFFICIENT_STOCK");
  return {
    ...data,
    inventory: data.inventory.map((i) =>
      i.productId === productId ? { ...i, quantity, updatedAt: at } : i,
    ),
    movements: [
      {
        id: crypto.randomUUID(),
        productId,
        delta,
        resultingQuantity: quantity,
        reason: reason.trim(),
        at,
      },
      ...data.movements,
    ],
  };
}
export function setFulfillment(
  data: BusinessData,
  orderId: string,
  status: Order["fulfillmentStatus"],
  note = "",
  at = new Date().toISOString(),
): BusinessData {
  return {
    ...data,
    orders: data.orders.map((o) =>
      o.id !== orderId
        ? o
        : {
            ...o,
            fulfillmentStatus: status,
            history: [...o.history, { status, at, note }],
          },
    ),
  };
}
export function promotionState(
  p: Promotion,
  now = new Date(),
): "scheduled" | "active" | "expired" | "exhausted" | "inactive" {
  if (!p.active) return "inactive";
  if (p.usageLimit !== undefined && p.usageCount >= p.usageLimit)
    return "exhausted";
  const time = now.getTime();
  if (time < new Date(p.startsAt).getTime()) return "scheduled";
  if (time > new Date(p.expiresAt).getTime()) return "expired";
  return "active";
}

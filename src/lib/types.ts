// Response shapes returned by the route handlers in src/app/api.

export type OrderItemPayload = {
  name: string;
  qty: number;
  price: number;
};

export type OrderStatusLog = {
  id: string;
  status: string;
  note: string;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  service: string; // KILOAN | SATUAN
  status: string; // see ORDER_STATUSES
  deliveryType: "PICKUP" | "DELIVERY";
  deliveryFee: number;
  /** Stored as a JSON string by POST /api/orders; older rows may already be parsed. */
  items: string | OrderItemPayload[];
  weight: number | null;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  statusLogs?: OrderStatusLog[];
  user?: { name: string; email: string; phone: string | null };
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

/** Items may arrive as a JSON string, so normalise before rendering. */
export function parseItems(items: Order["items"]): OrderItemPayload[] {
  if (Array.isArray(items)) return items;
  try {
    const parsed = JSON.parse(items) as unknown;
    return Array.isArray(parsed) ? (parsed as OrderItemPayload[]) : [];
  } catch {
    return [];
  }
}

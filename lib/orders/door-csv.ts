/**
 * Pure door-CSV helpers (DESIGN Appendix F).
 * No server-only / Supabase — safe for unit tests.
 */

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "expired",
  "cancelled",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Minimal order shape needed for door CSV. */
export type DoorCsvOrder = {
  id: string;
  quantity: number;
  event_slug: string;
  ticket_type_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  status: string;
  paid_at: string | null;
};

/**
 * Neutralize spreadsheet formula injection for Excel/Sheets.
 * Leading = + - @ \t \r can trigger formula mode when opened in Excel.
 * Prefix with a single quote (Excel text marker); still human-readable.
 */
export function neutralizeCsvFormula(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.length === 0) return s;
  const first = s[0];
  if (
    first === "=" ||
    first === "+" ||
    first === "-" ||
    first === "@" ||
    first === "\t" ||
    first === "\r"
  ) {
    return `'${s}`;
  }
  return s;
}

/** Escape a CSV field (RFC-style quotes) after optional formula neutralization. */
export function csvEscape(
  value: string | number | null | undefined,
  options?: { formulaSafe?: boolean },
): string {
  const raw =
    options?.formulaSafe === false
      ? value === null || value === undefined
        ? ""
        : String(value)
      : neutralizeCsvFormula(value);
  if (raw === "") return "";
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Door CSV (DESIGN Appendix F): one row per ticket unit.
 * Columns: order_id, ticket_index, quantity_total, event_slug, ticket_type_id,
 * buyer_name, buyer_email, buyer_phone, status, paid_at
 *
 * Buyer text fields are formula-neutralized for Excel safety.
 */
export function buildDoorCsv(orders: DoorCsvOrder[]): string {
  const header = [
    "order_id",
    "ticket_index",
    "quantity_total",
    "event_slug",
    "ticket_type_id",
    "buyer_name",
    "buyer_email",
    "buyer_phone",
    "status",
    "paid_at",
  ].join(",");

  const lines: string[] = [header];

  for (const order of orders) {
    const qty = Math.max(1, Number(order.quantity) || 1);
    for (let i = 1; i <= qty; i += 1) {
      lines.push(
        [
          csvEscape(order.id, { formulaSafe: false }),
          csvEscape(i, { formulaSafe: false }),
          csvEscape(qty, { formulaSafe: false }),
          csvEscape(order.event_slug),
          csvEscape(order.ticket_type_id),
          csvEscape(order.buyer_name),
          csvEscape(order.buyer_email),
          csvEscape(order.buyer_phone),
          csvEscape(order.status, { formulaSafe: false }),
          csvEscape(order.paid_at, { formulaSafe: false }),
        ].join(","),
      );
    }
  }

  return lines.join("\n") + "\n";
}

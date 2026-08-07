"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { formatPriceCents } from "@/lib/events";

export type CheckoutFormTicket = {
  id: string;
  name: string;
  priceCents: number;
  maxPerOrder: number;
  description?: string | null;
};

export type CheckoutFormProps = {
  eventSlug: string;
  eventTitle: string;
  ticket: CheckoutFormTicket;
  /** Facility fee in cents for paid tickets (0 for free). */
  facilityFeeCents: number;
  ticketingEnabled: boolean;
};

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Codes / statuses where a new attempt must use a fresh idempotency key. */
function shouldRotateIdempotencyKey(
  status: number,
  code?: string,
  retryWithNewKey?: boolean,
): boolean {
  if (retryWithNewKey) return true;
  if (status === 502 || status === 410) return true;
  if (
    code === "STRIPE_ERROR" ||
    code === "RESERVATION_EXPIRED" ||
    code === "CONFLICT"
  ) {
    return true;
  }
  return false;
}

export function CheckoutForm({
  eventSlug,
  eventTitle,
  ticket,
  facilityFeeCents,
  ticketingEnabled,
}: CheckoutFormProps) {
  const router = useRouter();
  const isFree = ticket.priceCents === 0;

  // Reused on retry for successful double-submit; rotated after payment failure.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    newIdempotencyKey(),
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxQty = Math.max(1, ticket.maxPerOrder);

  const ticketSubtotal = ticket.priceCents * quantity;
  const fee = isFree ? 0 : facilityFeeCents;
  const total = ticketSubtotal + fee;

  const qtyOptions = useMemo(
    () => Array.from({ length: maxQty }, (_, i) => i + 1),
    [maxQty],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!ticketingEnabled) {
        setError("Ticketing is temporarily disabled.");
        return;
      }

      if (!name.trim() || !email.trim() || !phone.trim()) {
        setError("Please fill in name, email, and phone.");
        return;
      }

      setSubmitting(true);
      // Capture key for this attempt; may rotate after failure for next submit.
      const keyForAttempt = idempotencyKey;
      try {
        const endpoint = isFree
          ? "/api/checkout/rsvp"
          : "/api/checkout/session";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventSlug,
            ticketTypeId: ticket.id,
            quantity,
            buyer: {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
            },
            marketingOptIn,
            acceptedLegal,
            idempotencyKey: keyForAttempt,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          url?: string;
          orderId?: string;
          confirmToken?: string;
          successUrl?: string;
          error?: string;
          code?: string;
          message?: string;
          replayed?: boolean;
          retryWithNewKey?: boolean;
        };

        if (!res.ok) {
          if (
            shouldRotateIdempotencyKey(
              res.status,
              data.code,
              data.retryWithNewKey,
            )
          ) {
            setIdempotencyKey(newIdempotencyKey());
          }
          setError(data.error || `Request failed (${res.status})`);
          return;
        }

        if (isFree) {
          if (data.successUrl) {
            router.push(data.successUrl);
            return;
          }
          if (data.orderId && data.confirmToken) {
            router.push(
              `/checkout/success?order_id=${encodeURIComponent(data.orderId)}&token=${encodeURIComponent(data.confirmToken)}`,
            );
            return;
          }
          router.push(
            `/checkout/success?order_id=${encodeURIComponent(data.orderId || "")}`,
          );
          return;
        }

        if (data.url) {
          window.location.href = data.url;
          return;
        }

        // No URL on success path — rotate so user can retry cleanly
        setIdempotencyKey(newIdempotencyKey());
        setError("No checkout URL returned. Please try again.");
      } catch {
        // Network blip: keep key so double-submit still dedupes if server got it
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      acceptedLegal,
      email,
      eventSlug,
      idempotencyKey,
      isFree,
      marketingOptIn,
      name,
      phone,
      quantity,
      router,
      ticket.id,
      ticketingEnabled,
    ],
  );

  if (!ticketingEnabled) {
    return (
      <p
        className="rounded-lg border border-border bg-surface p-4 text-muted"
        role="status"
      >
        Ticketing is temporarily disabled. Please check back later.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Order summary
        </h2>
        <p className="mt-2 font-medium text-fg">{eventTitle}</p>
        <p className="text-sm text-muted">{ticket.name}</p>
        {ticket.description ? (
          <p className="mt-1 text-sm text-muted">{ticket.description}</p>
        ) : null}

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">
              {isFree ? "RSVP" : "Tickets"} × {quantity}
            </dt>
            <dd className="font-medium text-fg">
              {isFree ? "Free" : formatPriceCents(ticketSubtotal)}
            </dd>
          </div>
          {!isFree && fee > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Facility fee</dt>
              <dd className="font-medium text-fg">{formatPriceCents(fee)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-semibold text-fg">Total</dt>
            <dd className="font-semibold text-fg">
              {isFree ? "Free" : formatPriceCents(total)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="checkout-name"
            className="mb-1 block text-sm font-medium text-fg"
          >
            Full name
          </label>
          <input
            id="checkout-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-email"
            className="mb-1 block text-sm font-medium text-fg"
          >
            Email
          </label>
          <input
            id="checkout-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-phone"
            className="mb-1 block text-sm font-medium text-fg"
          >
            Phone
          </label>
          <input
            id="checkout-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            placeholder="+1 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-h-11 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg"
            aria-describedby="checkout-phone-hint"
          />
          <p id="checkout-phone-hint" className="mt-1 text-xs text-muted">
            US numbers OK — we convert to international format (E.164).
          </p>
        </div>

        <div>
          <label
            htmlFor="checkout-qty"
            className="mb-1 block text-sm font-medium text-fg"
          >
            Quantity
          </label>
          <select
            id="checkout-qty"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="min-h-11 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg sm:w-auto"
          >
            {qtyOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="checkout-legal"
            name="acceptedLegal"
            type="checkbox"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border"
          />
          <label htmlFor="checkout-legal" className="text-sm text-muted">
            I agree to the{" "}
            <a
              href="/terms"
              className="text-accent underline underline-offset-2"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-accent underline underline-offset-2"
            >
              Privacy Policy
            </a>
            .{" "}
            <span className="text-xs">
              (Optional stub — required in a later release.)
            </span>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="checkout-marketing"
            name="marketingOptIn"
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border"
          />
          <label htmlFor="checkout-marketing" className="text-sm text-muted">
            Send me updates about 96 Nation events (optional).
          </label>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting
          ? isFree
            ? "Confirming…"
            : "Redirecting…"
          : isFree
            ? "Confirm RSVP"
            : "Pay with card"}
      </Button>
    </form>
  );
}

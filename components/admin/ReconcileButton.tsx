"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
};

/**
 * Admin reconcile — POST /api/admin/orders/[id]/reconcile then refresh.
 */
export function ReconcileButton({ orderId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reconcile`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        action?: string;
        audit_failed?: boolean;
      };

      if (!res.ok) {
        // Audit may fail after reconcile applied — still refresh so status is visible
        if (body.audit_failed) {
          const msg = encodeURIComponent(
            body.error || body.message || "audit failed after reconcile",
          );
          router.push(`/admin/orders/${orderId}?error=${msg}`);
          router.refresh();
          return;
        }
        setError(body.error || `Reconcile failed (${res.status})`);
        setBusy(false);
        return;
      }

      const msg = encodeURIComponent(
        body.message || body.action || "done",
      );
      router.push(
        `/admin/orders/${orderId}?reconciled=1&msg=${msg}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="primary"
        disabled={busy}
        aria-busy={busy}
        onClick={onClick}
      >
        {busy ? "Reconciling…" : "Reconcile"}
      </Button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-muted max-w-md">
        Fetches the Stripe Checkout Session (or payment intent), fulfills if
        paid, expires if unpaid, or syncs refund status.
      </p>
    </div>
  );
}

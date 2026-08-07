/**
 * PII delete / anonymize stub — data subject erasure by email.
 *
 * Usage:
 *   npx tsx scripts/pii-delete.ts --email buyer@example.com --confirm
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Default behavior (v1 policy sketch):
 *   - Anonymize buyer fields on orders (retain order id / amounts for accounting)
 *   - Delete form_submissions for that email
 *
 * Review legal retention needs before running in production.
 * Always export first: scripts/pii-export.ts
 *
 * TODO: align anonymization with final privacy policy; audit_log write;
 *       handle Stripe customer objects if any are stored later.
 */

function parseArgs(argv: string[]): { email: string | null; confirm: boolean } {
  let email: string | null = null;
  let confirm = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--email" && argv[i + 1]) {
      email = argv[++i]!.trim().toLowerCase();
    }
    if (argv[i] === "--confirm") confirm = true;
  }
  return { email, confirm };
}

async function main() {
  const { email, confirm } = parseArgs(process.argv.slice(2));
  if (!email) {
    console.error(
      "Usage: npx tsx scripts/pii-delete.ts --email user@example.com --confirm",
    );
    process.exit(1);
  }
  if (!confirm) {
    console.error(
      "Refusing to run without --confirm. Export data first, then re-run with --confirm.",
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.",
    );
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const redacted = {
    buyer_name: "[redacted]",
    buyer_email: `redacted+${Date.now()}@invalid.local`,
    buyer_phone: "",
  };

  const ordersUpdate = await supabase
    .from("orders")
    .update(redacted)
    .ilike("buyer_email", email)
    .select("id");

  if (ordersUpdate.error) {
    console.error("orders anonymize failed:", ordersUpdate.error.message);
    process.exit(1);
  }

  // Prefer delete of form rows; payload often duplicates contact fields.
  const formsDelete = await supabase
    .from("form_submissions")
    .delete()
    .filter("payload->>email", "ilike", email)
    .select("id");

  if (formsDelete.error) {
    console.error("form_submissions delete failed:", formsDelete.error.message);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        ordersAnonymized: (ordersUpdate.data ?? []).map((r) => r.id),
        formsDeleted: (formsDelete.data ?? []).map((r) => r.id),
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

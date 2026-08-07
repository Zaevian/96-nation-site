/**
 * PII export stub — data subject / support export by email.
 *
 * Usage (after installing tsx or compiling):
 *   npx tsx scripts/pii-export.ts --email buyer@example.com
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Output: JSON to stdout (orders + form_submissions matching email).
 * Treat output as confidential. Do not paste into public channels.
 *
 * TODO: wire exact column selects if schema drifts; add --out file.json;
 *       redact internal ids if policy requires.
 */

function parseArgs(argv: string[]): { email: string | null } {
  let email: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--email" && argv[i + 1]) {
      email = argv[++i]!.trim().toLowerCase();
    }
  }
  return { email };
}

async function main() {
  const { email } = parseArgs(process.argv.slice(2));
  if (!email) {
    console.error("Usage: npx tsx scripts/pii-export.ts --email user@example.com");
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

  // Lazy import so the script can be present without breaking installs that
  // never run it. Uses the same service-role path as the app.
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [ordersRes, formsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, event_id, event_slug, ticket_type_id, quantity, status, buyer_name, buyer_email, buyer_phone, unit_price_cents, facility_fee_cents, total_cents, currency, paid_at, created_at, stripe_checkout_session_id",
      )
      .ilike("buyer_email", email),
    supabase
      .from("form_submissions")
      .select("id, form_type, payload, source_path, created_at, notified_at")
      .filter("payload->>email", "ilike", email),
  ]);

  if (ordersRes.error) {
    console.error("orders query failed:", ordersRes.error.message);
    process.exit(1);
  }
  if (formsRes.error) {
    console.error("form_submissions query failed:", formsRes.error.message);
    process.exit(1);
  }

  const report = {
    exportedAt: new Date().toISOString(),
    email,
    orders: ordersRes.data ?? [],
    formSubmissions: formsRes.data ?? [],
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

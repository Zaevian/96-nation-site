-- PR 7: Supabase schema — inventory, orders, forms, webhooks, outbox, audit
-- Matches DESIGN.md inventory reservation model + Appendix B / D.
-- RLS: ENABLE on all tables; intentionally NO policies for anon/authenticated.
-- Access: service role only from Next.js server (bypasses RLS).
-- v1: no attendees table; door list expands from orders.quantity at export.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type order_status as enum (
  'pending',
  'paid',
  'fulfilled',
  'expired',
  'cancelled',
  'failed',
  'refunded',
  'partially_refunded'
);

-- ---------------------------------------------------------------------------
-- ticket_inventory (authoritative capacity)
-- Remaining = capacity - sold_count - reserved_count
-- ---------------------------------------------------------------------------
create table ticket_inventory (
  event_id text not null,
  ticket_type_id text not null,
  capacity int not null check (capacity >= 0),
  sold_count int not null default 0 check (sold_count >= 0),
  reserved_count int not null default 0 check (reserved_count >= 0),
  version int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (event_id, ticket_type_id),
  check (sold_count + reserved_count <= capacity)
);

comment on table ticket_inventory is
  'Authoritative capacity SoT after first sync/on-sale. Sanity holds editorial + initial capacity.';

-- ---------------------------------------------------------------------------
-- orders (buyer PII + quantity; no attendees table in v1)
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  event_id text not null,
  ticket_type_id text not null,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  facility_fee_cents int not null default 0 check (facility_fee_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  currency text not null default 'usd',
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  marketing_opt_in boolean not null default false,
  status order_status not null default 'pending',
  idempotency_key uuid not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  reservation_expires_at timestamptz,
  confirm_token_hash text,
  confirmation_email_sent_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (idempotency_key)
);

create index orders_event_status_idx on orders (event_id, status);
create index orders_pending_expiry_idx on orders (status, reservation_expires_at)
  where status = 'pending';
create index orders_buyer_email_idx on orders (buyer_email);
create index orders_stripe_pi_idx on orders (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

comment on table orders is
  'One row per checkout; door list expands quantity at CSV export. No attendees table in v1.';
comment on column orders.facility_fee_cents is
  'Snapshot of FACILITY_FEE_CENTS at create; 0 for free/RSVP.';
comment on column orders.confirm_token_hash is
  'Hash of free-path success token; never store raw token.';

-- ---------------------------------------------------------------------------
-- form_submissions (Genesis + contact)
-- ---------------------------------------------------------------------------
create table form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('signup', 'service_inquiry', 'contact')),
  payload jsonb not null,
  source_path text,
  user_agent text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  constraint payload_size check (pg_column_size(payload) <= 8192)
);

create index form_submissions_type_created_idx
  on form_submissions (form_type, created_at desc);

-- ---------------------------------------------------------------------------
-- stripe_webhook_events (two-phase: processing → processed | failed)
-- Short-circuit duplicates ONLY when status = 'processed'.
-- Rows stuck in processing/failed are re-entered on Stripe retry.
-- ---------------------------------------------------------------------------
create table stripe_webhook_events (
  id text primary key,
  type text not null,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  attempts int not null default 1,
  last_error text,
  order_id uuid references orders (id),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index stripe_webhook_events_status_idx
  on stripe_webhook_events (status)
  where status <> 'processed';

comment on table stripe_webhook_events is
  'Two-phase webhook idempotency. Do not short-circuit unless status=processed.';

-- ---------------------------------------------------------------------------
-- email_outbox (async Resend; unique dedupe_key prevents double send)
-- ---------------------------------------------------------------------------
create table email_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  to_email text not null,
  template text not null,
  payload jsonb not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index email_outbox_unsent_idx on email_outbox (created_at)
  where sent_at is null;

comment on column email_outbox.dedupe_key is
  'e.g. order_confirm:{orderId} — unique so retries do not double-send.';

-- ---------------------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------------------
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_idx on admin_audit_log (created_at desc);
create index admin_audit_log_actor_idx on admin_audit_log (actor_email);

comment on column admin_audit_log.action is
  'csv_export | view_order | reconcile | data_delete | admin_cancel | ...';

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create trigger ticket_inventory_set_updated_at
  before update on ticket_inventory
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventory operations (Appendix B / inventory model)
-- Atomic reserve / commit / release; 0 rows = failure (sold out / bad state).
-- ---------------------------------------------------------------------------

-- Reserve qty at checkout-session create or RSVP start.
-- Fails closed when sold_count + reserved_count + qty > capacity.
create or replace function reserve_inventory(
  p_event_id text,
  p_ticket_type_id text,
  p_qty int
)
returns setof ticket_inventory
language sql
as $$
  update ticket_inventory
  set
    reserved_count = reserved_count + p_qty,
    version = version + 1,
    updated_at = now()
  where event_id = p_event_id
    and ticket_type_id = p_ticket_type_id
    and p_qty > 0
    and sold_count + reserved_count + p_qty <= capacity
  returning *;
$$;

comment on function reserve_inventory is
  'Hold capacity at session create. 0 rows → SOLD_OUT. Call inside Tx1 with order insert.';

-- Commit reserved → sold (paid webhook or free RSVP finalize).
create or replace function commit_inventory(
  p_event_id text,
  p_ticket_type_id text,
  p_qty int
)
returns setof ticket_inventory
language sql
as $$
  update ticket_inventory
  set
    reserved_count = reserved_count - p_qty,
    sold_count = sold_count + p_qty,
    version = version + 1,
    updated_at = now()
  where event_id = p_event_id
    and ticket_type_id = p_ticket_type_id
    and p_qty > 0
    and reserved_count >= p_qty
  returning *;
$$;

comment on function commit_inventory is
  'Move reserved → sold on payment/RSVP success. Guard with order status=pending.';

-- Release reserved (expired session, admin cancel, Stripe create failure).
create or replace function release_inventory(
  p_event_id text,
  p_ticket_type_id text,
  p_qty int
)
returns setof ticket_inventory
language sql
as $$
  update ticket_inventory
  set
    reserved_count = reserved_count - p_qty,
    version = version + 1,
    updated_at = now()
  where event_id = p_event_id
    and ticket_type_id = p_ticket_type_id
    and p_qty > 0
    and reserved_count >= p_qty
  returning *;
$$;

comment on function release_inventory is
  'Free reserved capacity on expire/cancel/failed. Idempotent with webhook+cron via order status.';

-- Upsert capacity from Sanity sync (Appendix B).
-- Prefer app-level reject when new_capacity < sold+reserved rather than silent no-op.
create or replace function sync_inventory_capacity(
  p_event_id text,
  p_ticket_type_id text,
  p_capacity int
)
returns ticket_inventory
language plpgsql
as $$
declare
  result ticket_inventory;
begin
  if p_capacity < 0 then
    raise exception 'capacity must be >= 0';
  end if;

  insert into ticket_inventory (event_id, ticket_type_id, capacity)
  values (p_event_id, p_ticket_type_id, p_capacity)
  on conflict (event_id, ticket_type_id) do update
  set
    capacity = case
      when ticket_inventory.sold_count + ticket_inventory.reserved_count = 0
        then excluded.capacity
      when excluded.capacity >= ticket_inventory.sold_count + ticket_inventory.reserved_count
        then excluded.capacity
      else ticket_inventory.capacity
    end,
    updated_at = now()
  returning * into result;

  -- App layer should error when requested capacity was rejected (below sold+reserved).
  if result.capacity <> p_capacity
     and (result.sold_count + result.reserved_count) > 0
     and p_capacity < (result.sold_count + result.reserved_count) then
    raise exception 'capacity % below sold+reserved % for %.%',
      p_capacity,
      result.sold_count + result.reserved_count,
      p_event_id,
      p_ticket_type_id
      using errcode = 'check_violation';
  end if;

  return result;
end;
$$;

-- Decrement sold_count on full refund (once). Partial refunds do not change sold.
create or replace function refund_inventory(
  p_event_id text,
  p_ticket_type_id text,
  p_qty int
)
returns setof ticket_inventory
language sql
as $$
  update ticket_inventory
  set
    sold_count = sold_count - p_qty,
    version = version + 1,
    updated_at = now()
  where event_id = p_event_id
    and ticket_type_id = p_ticket_type_id
    and p_qty > 0
    and sold_count >= p_qty
  returning *;
$$;

-- ---------------------------------------------------------------------------
-- RLS: enable + deny-all for anon/authenticated (Appendix D)
-- service_role bypasses RLS — use only from Next.js server after app authz.
-- ---------------------------------------------------------------------------
alter table ticket_inventory enable row level security;
alter table orders enable row level security;
alter table form_submissions enable row level security;
alter table stripe_webhook_events enable row level security;
alter table email_outbox enable row level security;
alter table admin_audit_log enable row level security;

-- Intentionally no policies for anon / authenticated.
-- Default deny for non-service roles.
--
-- Verification (manual):
--   set role anon; select * from orders;  -- 0 rows / permission denied
--   service_role key via API: full access

-- ---------------------------------------------------------------------------
-- Release expired reservations (cron pseudocode — app implements in Next):
--   1) select id, event_id, ticket_type_id, quantity from orders
--        where status = 'pending' and reservation_expires_at < now() for update
--   2) perform release_inventory(event_id, ticket_type_id, quantity)
--   3) update orders set status = 'expired', updated_at = now() where id = ...
-- ---------------------------------------------------------------------------

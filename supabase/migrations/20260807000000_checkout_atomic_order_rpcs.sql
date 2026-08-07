-- PR 9a review fixes: atomic Tx1 / RSVP / fail paths (single PL/pgSQL transactions).
-- reserve + insert (or reserve+commit+insert, or release+failed) commit or roll back together.
-- Also explicit GRANT EXECUTE to service_role for inventory + checkout RPCs.

-- ---------------------------------------------------------------------------
-- Paid Tx1: reserve inventory + insert pending order (no Stripe session yet)
-- Any exception rolls back reserve automatically.
-- ---------------------------------------------------------------------------
create or replace function create_pending_order_with_reserve(
  p_event_id text,
  p_ticket_type_id text,
  p_qty int,
  p_event_slug text,
  p_unit_price_cents int,
  p_facility_fee_cents int,
  p_currency text,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_marketing_opt_in boolean,
  p_idempotency_key uuid,
  p_reservation_minutes int default 30
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
  v_total int;
  v_expires timestamptz;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'qty must be > 0' using errcode = '22023';
  end if;
  if p_unit_price_cents is null or p_unit_price_cents < 0 then
    raise exception 'unit_price_cents must be >= 0' using errcode = '22023';
  end if;
  if p_facility_fee_cents is null or p_facility_fee_cents < 0 then
    raise exception 'facility_fee_cents must be >= 0' using errcode = '22023';
  end if;

  -- Raises P0001 SOLD_OUT or P0002 missing inventory.
  perform reserve_inventory(p_event_id, p_ticket_type_id, p_qty);

  v_total := p_unit_price_cents * p_qty + p_facility_fee_cents;
  v_expires := now() + make_interval(mins => greatest(coalesce(p_reservation_minutes, 30), 1));

  insert into orders (
    event_slug,
    event_id,
    ticket_type_id,
    quantity,
    unit_price_cents,
    facility_fee_cents,
    total_cents,
    currency,
    buyer_name,
    buyer_email,
    buyer_phone,
    marketing_opt_in,
    status,
    idempotency_key,
    reservation_expires_at
  )
  values (
    p_event_slug,
    p_event_id,
    p_ticket_type_id,
    p_qty,
    p_unit_price_cents,
    p_facility_fee_cents,
    v_total,
    coalesce(nullif(p_currency, ''), 'usd'),
    p_buyer_name,
    p_buyer_email,
    p_buyer_phone,
    coalesce(p_marketing_opt_in, false),
    'pending',
    p_idempotency_key,
    v_expires
  )
  returning * into v_order;

  return v_order;
end;
$$;

comment on function create_pending_order_with_reserve is
  'Atomic Tx1: reserve_inventory + insert pending order. Rolls back reserve if insert fails.';

-- ---------------------------------------------------------------------------
-- Free RSVP: reserve → commit sold → insert paid order with token hash
-- ---------------------------------------------------------------------------
create or replace function finalize_rsvp_order(
  p_event_id text,
  p_ticket_type_id text,
  p_qty int,
  p_event_slug text,
  p_currency text,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_marketing_opt_in boolean,
  p_idempotency_key uuid,
  p_confirm_token_hash text
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
  v_commit ticket_inventory;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'qty must be > 0' using errcode = '22023';
  end if;
  if p_confirm_token_hash is null or length(trim(p_confirm_token_hash)) = 0 then
    raise exception 'confirm_token_hash required' using errcode = '22023';
  end if;

  perform reserve_inventory(p_event_id, p_ticket_type_id, p_qty);

  select * into v_commit
  from commit_inventory(p_event_id, p_ticket_type_id, p_qty);

  if not found or v_commit.event_id is null then
    raise exception 'commit_inventory affected 0 rows for %.%',
      p_event_id, p_ticket_type_id
      using errcode = 'P0001';
  end if;

  insert into orders (
    event_slug,
    event_id,
    ticket_type_id,
    quantity,
    unit_price_cents,
    facility_fee_cents,
    total_cents,
    currency,
    buyer_name,
    buyer_email,
    buyer_phone,
    marketing_opt_in,
    status,
    idempotency_key,
    confirm_token_hash,
    paid_at,
    reservation_expires_at
  )
  values (
    p_event_slug,
    p_event_id,
    p_ticket_type_id,
    p_qty,
    0,
    0,
    0,
    coalesce(nullif(p_currency, ''), 'usd'),
    p_buyer_name,
    p_buyer_email,
    p_buyer_phone,
    coalesce(p_marketing_opt_in, false),
    'paid',
    p_idempotency_key,
    p_confirm_token_hash,
    now(),
    null
  )
  returning * into v_order;

  return v_order;
end;
$$;

comment on function finalize_rsvp_order is
  'Atomic free RSVP: reserve + commit sold + insert paid order. Full rollback on any failure.';

-- ---------------------------------------------------------------------------
-- Fail path: release reserve + mark pending order failed (single transaction)
-- Raises if release returns 0 rows while order is still pending with a hold.
-- ---------------------------------------------------------------------------
create or replace function fail_pending_order(
  p_order_id uuid
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
  v_released ticket_inventory;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status is distinct from 'pending' then
    return v_order; -- already terminal; no-op
  end if;

  select * into v_released
  from release_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);

  if not found or v_released.event_id is null then
    raise exception
      'release_inventory returned 0 rows for order % (event %.% qty %) — reserved_count may already be low',
      p_order_id, v_order.event_id, v_order.ticket_type_id, v_order.quantity
      using errcode = 'P0001';
  end if;

  update orders
  set
    status = 'failed',
    stripe_checkout_session_id = null
  where id = p_order_id
    and status = 'pending'
  returning * into v_order;

  return v_order;
end;
$$;

comment on function fail_pending_order is
  'Atomic Tx2 fail: release reserve + status=failed. Errors if release is a no-op.';

-- ---------------------------------------------------------------------------
-- Reactivate failed order for same-key retry (re-reserve, pending, new TTL)
-- ---------------------------------------------------------------------------
create or replace function reactivate_failed_order_with_reserve(
  p_idempotency_key uuid,
  p_reservation_minutes int default 30
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
  v_expires timestamptz;
begin
  select * into v_order
  from orders
  where idempotency_key = p_idempotency_key
  for update;

  if not found then
    raise exception 'order not found for idempotency_key' using errcode = 'P0002';
  end if;

  if v_order.status is distinct from 'failed' then
    raise exception 'order status % is not failed; cannot reactivate', v_order.status
      using errcode = '22023';
  end if;

  perform reserve_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);

  v_expires := now() + make_interval(mins => greatest(coalesce(p_reservation_minutes, 30), 1));

  update orders
  set
    status = 'pending',
    stripe_checkout_session_id = null,
    reservation_expires_at = v_expires
  where id = v_order.id
    and status = 'failed'
  returning * into v_order;

  if not found then
    raise exception 'failed to reactivate order %', v_order.id;
  end if;

  return v_order;
end;
$$;

comment on function reactivate_failed_order_with_reserve is
  'Same idempotency_key retry after Stripe failure: re-reserve + pending + clear session.';

-- ---------------------------------------------------------------------------
-- Extend reservation TTL (keep Stripe expires_at in sync)
-- ---------------------------------------------------------------------------
create or replace function extend_order_reservation(
  p_order_id uuid,
  p_expires_at timestamptz
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
begin
  update orders
  set reservation_expires_at = p_expires_at
  where id = p_order_id
    and status = 'pending'
  returning * into v_order;

  if not found then
    raise exception 'pending order % not found for TTL extend', p_order_id
      using errcode = 'P0002';
  end if;

  return v_order;
end;
$$;

-- Clear stripe session id so a new Checkout Session can be attached.
create or replace function clear_order_stripe_session(
  p_order_id uuid
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
begin
  update orders
  set stripe_checkout_session_id = null
  where id = p_order_id
    and status = 'pending'
  returning * into v_order;

  if not found then
    raise exception 'pending order % not found for session clear', p_order_id
      using errcode = 'P0002';
  end if;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: service_role explicit EXECUTE (anon/authenticated stay revoked)
-- ---------------------------------------------------------------------------
revoke execute on function create_pending_order_with_reserve(
  text, text, int, text, int, int, text, text, text, text, boolean, uuid, int
) from public, anon, authenticated;
revoke execute on function finalize_rsvp_order(
  text, text, int, text, text, text, text, text, boolean, uuid, text
) from public, anon, authenticated;
revoke execute on function fail_pending_order(uuid) from public, anon, authenticated;
revoke execute on function reactivate_failed_order_with_reserve(uuid, int)
  from public, anon, authenticated;
revoke execute on function extend_order_reservation(uuid, timestamptz)
  from public, anon, authenticated;
revoke execute on function clear_order_stripe_session(uuid)
  from public, anon, authenticated;

grant execute on function reserve_inventory(text, text, int) to service_role;
grant execute on function commit_inventory(text, text, int) to service_role;
grant execute on function release_inventory(text, text, int) to service_role;
grant execute on function refund_inventory(text, text, int) to service_role;
grant execute on function sync_inventory_capacity(text, text, int) to service_role;
grant execute on function create_pending_order_with_reserve(
  text, text, int, text, int, int, text, text, text, text, boolean, uuid, int
) to service_role;
grant execute on function finalize_rsvp_order(
  text, text, int, text, text, text, text, text, boolean, uuid, text
) to service_role;
grant execute on function fail_pending_order(uuid) to service_role;
grant execute on function reactivate_failed_order_with_reserve(uuid, int) to service_role;
grant execute on function extend_order_reservation(uuid, timestamptz) to service_role;
grant execute on function clear_order_stripe_session(uuid) to service_role;

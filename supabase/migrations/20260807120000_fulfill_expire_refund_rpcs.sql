-- PR 9b: atomic fulfill / expire / full-refund order RPCs for webhook + cron.
-- Business effects guarded by status transitions (pending→paid, pending→expired,
-- paid|fulfilled→refunded). Concurrent double-delivery is a no-op.

-- ---------------------------------------------------------------------------
-- Fulfill paid checkout: pending → paid, reserved → sold, attach PI / session
-- ---------------------------------------------------------------------------
create or replace function fulfill_pending_order(
  p_order_id uuid,
  p_stripe_payment_intent_id text default null,
  p_stripe_checkout_session_id text default null
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  -- Already fulfilled / terminal — idempotent no-op (return current row).
  if v_order.status is distinct from 'pending' then
    return v_order;
  end if;

  perform commit_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);

  update orders
  set
    status = 'paid',
    paid_at = coalesce(paid_at, now()),
    stripe_payment_intent_id = coalesce(
      nullif(p_stripe_payment_intent_id, ''),
      stripe_payment_intent_id
    ),
    stripe_checkout_session_id = coalesce(
      stripe_checkout_session_id,
      nullif(p_stripe_checkout_session_id, '')
    ),
    reservation_expires_at = null
  where id = p_order_id
    and status = 'pending'
  returning * into v_order;

  if not found then
    -- Race: another worker fulfilled; re-read
    select * into v_order from orders where id = p_order_id;
  end if;

  return v_order;
end;
$$;

comment on function fulfill_pending_order is
  'Webhook fulfill: pending→paid + commit_inventory. No-op if not pending.';

-- ---------------------------------------------------------------------------
-- Expire pending reservation: release inventory, status=expired
-- Idempotent with fail_pending_order / cron / session.expired
-- ---------------------------------------------------------------------------
create or replace function expire_pending_order(
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
    return v_order; -- already terminal
  end if;

  select * into v_released
  from release_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);

  if not found or v_released.event_id is null then
    raise exception
      'release_inventory returned 0 rows for order % (event %.% qty %)',
      p_order_id, v_order.event_id, v_order.ticket_type_id, v_order.quantity
      using errcode = 'P0001';
  end if;

  update orders
  set
    status = 'expired',
    reservation_expires_at = null
  where id = p_order_id
    and status = 'pending'
  returning * into v_order;

  if not found then
    select * into v_order from orders where id = p_order_id;
  end if;

  return v_order;
end;
$$;

comment on function expire_pending_order is
  'TTL/cron/session.expired: release reserve + status=expired. No-op if not pending.';

-- ---------------------------------------------------------------------------
-- Full refund: paid|fulfilled → refunded, sold_count -= quantity once
-- ---------------------------------------------------------------------------
create or replace function refund_paid_order(
  p_order_id uuid,
  p_admin_note text default null
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  -- Already fully refunded — idempotent no-op (do not decrement sold again).
  if v_order.status = 'refunded' then
    return v_order;
  end if;

  if v_order.status not in ('paid', 'fulfilled', 'partially_refunded') then
    raise exception 'order % status % cannot full-refund', p_order_id, v_order.status
      using errcode = '22023';
  end if;

  -- Only decrement sold when capacity was committed (paid/fulfilled).
  -- partially_refunded may still hold sold; full refund restores once.
  if v_order.status in ('paid', 'fulfilled', 'partially_refunded') then
    perform refund_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);
  end if;

  update orders
  set
    status = 'refunded',
    admin_note = case
      when p_admin_note is not null and p_admin_note <> '' then
        trim(both from coalesce(admin_note || E'\n', '') || p_admin_note)
      else admin_note
    end
  where id = p_order_id
    and status in ('paid', 'fulfilled', 'partially_refunded')
  returning * into v_order;

  if not found then
    select * into v_order from orders where id = p_order_id;
  end if;

  return v_order;
end;
$$;

comment on function refund_paid_order is
  'Full refund webhook: sold_count -= qty once, status=refunded. Idempotent.';

-- ---------------------------------------------------------------------------
-- Partial refund: paid|fulfilled → partially_refunded; NO sold_count change
-- ---------------------------------------------------------------------------
create or replace function mark_order_partially_refunded(
  p_order_id uuid,
  p_admin_note text default null
)
returns orders
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_order orders;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status in ('refunded', 'partially_refunded') then
    -- Append note if provided; keep status
    if p_admin_note is not null and p_admin_note <> '' then
      update orders
      set admin_note = trim(both from coalesce(admin_note || E'\n', '') || p_admin_note)
      where id = p_order_id
      returning * into v_order;
    end if;
    return v_order;
  end if;

  if v_order.status not in ('paid', 'fulfilled') then
    raise exception 'order % status % cannot partial-refund', p_order_id, v_order.status
      using errcode = '22023';
  end if;

  update orders
  set
    status = 'partially_refunded',
    admin_note = case
      when p_admin_note is not null and p_admin_note <> '' then
        trim(both from coalesce(admin_note || E'\n', '') || p_admin_note)
      else admin_note
    end
  where id = p_order_id
    and status in ('paid', 'fulfilled')
  returning * into v_order;

  if not found then
    select * into v_order from orders where id = p_order_id;
  end if;

  return v_order;
end;
$$;

comment on function mark_order_partially_refunded is
  'Partial refund: status only; sold_count unchanged (manual door handling).';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function fulfill_pending_order(uuid, text, text)
  from public, anon, authenticated;
revoke execute on function expire_pending_order(uuid)
  from public, anon, authenticated;
revoke execute on function refund_paid_order(uuid, text)
  from public, anon, authenticated;
revoke execute on function mark_order_partially_refunded(uuid, text)
  from public, anon, authenticated;

grant execute on function fulfill_pending_order(uuid, text, text) to service_role;
grant execute on function expire_pending_order(uuid) to service_role;
grant execute on function refund_paid_order(uuid, text) to service_role;
grant execute on function mark_order_partially_refunded(uuid, text) to service_role;

-- PR 9b review fixes:
-- O-3: fulfill can resurrect expired orders when Stripe payment is verified paid
-- O-6: assert commit_inventory / refund_inventory returned a row

-- ---------------------------------------------------------------------------
-- Fulfill verified paid checkout:
--   pending → commit reserved→sold + paid
--   expired → re-sell capacity (sold += qty) + paid  (expire-then-pay race)
--   paid|fulfilled → idempotent no-op
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
  v_inv ticket_inventory;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  -- Already paid / fulfilled — idempotent no-op
  if v_order.status in ('paid', 'fulfilled') then
    -- Still attach PI/session ids if missing
    update orders
    set
      stripe_payment_intent_id = coalesce(
        stripe_payment_intent_id,
        nullif(p_stripe_payment_intent_id, '')
      ),
      stripe_checkout_session_id = coalesce(
        stripe_checkout_session_id,
        nullif(p_stripe_checkout_session_id, '')
      )
    where id = p_order_id
    returning * into v_order;
    return v_order;
  end if;

  if v_order.status = 'pending' then
    -- reserved → sold; require affected row (O-6)
    select * into v_inv
    from commit_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);

    if not found or v_inv.event_id is null then
      raise exception
        'commit_inventory returned 0 rows for order % (event %.% qty %) — reserved_count may be low',
        p_order_id, v_order.event_id, v_order.ticket_type_id, v_order.quantity
        using errcode = 'P0001';
    end if;

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
      select * into v_order from orders where id = p_order_id;
    end if;

    return v_order;
  end if;

  if v_order.status = 'expired' then
    -- O-3: capacity was released; re-acquire as sold (not via reserved hold)
    update ticket_inventory
    set
      sold_count = sold_count + v_order.quantity,
      version = version + 1
    where event_id = v_order.event_id
      and ticket_type_id = v_order.ticket_type_id
      and v_order.quantity > 0
      and sold_count + reserved_count + v_order.quantity <= capacity
    returning * into v_inv;

    if not found or v_inv.event_id is null then
      raise exception
        'SOLD_OUT: cannot resurrect expired paid order % for event %.% qty % (capacity gone)',
        p_order_id, v_order.event_id, v_order.ticket_type_id, v_order.quantity
        using errcode = 'P0001';
    end if;

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
      reservation_expires_at = null,
      admin_note = trim(both from coalesce(admin_note || E'\n', '')
        || 'Resurrected from expired after verified Stripe payment')
    where id = p_order_id
      and status = 'expired'
    returning * into v_order;

    if not found then
      select * into v_order from orders where id = p_order_id;
    end if;

    return v_order;
  end if;

  -- failed / cancelled / refunded / partially_refunded — do not auto-fulfill
  raise exception 'order % status % cannot fulfill', p_order_id, v_order.status
    using errcode = '22023';
end;
$$;

comment on function fulfill_pending_order is
  'Fulfill verified paid: pending→commit sold; expired→re-sell capacity (O-3). No-op if paid.';

-- ---------------------------------------------------------------------------
-- Full refund: assert refund_inventory affected a row (O-6)
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
  v_inv ticket_inventory;
begin
  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status = 'refunded' then
    return v_order;
  end if;

  if v_order.status not in ('paid', 'fulfilled', 'partially_refunded') then
    raise exception 'order % status % cannot full-refund', p_order_id, v_order.status
      using errcode = '22023';
  end if;

  select * into v_inv
  from refund_inventory(v_order.event_id, v_order.ticket_type_id, v_order.quantity);

  if not found or v_inv.event_id is null then
    raise exception
      'refund_inventory returned 0 rows for order % (event %.% qty %) — sold_count may be low',
      p_order_id, v_order.event_id, v_order.ticket_type_id, v_order.quantity
      using errcode = 'P0001';
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
  'Full refund: sold_count -= qty once (asserts inventory row). Idempotent if refunded.';

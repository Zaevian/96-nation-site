-- Local/dev seed for ticket_inventory.
-- Production inventory is upserted via /api/inventory/sync from Sanity (not this file).
-- Apply with: supabase db reset  (runs migrations + seed when configured)

insert into ticket_inventory (event_id, ticket_type_id, capacity, sold_count, reserved_count)
values
  ('evt_seed_demo_show', 'ga', 100, 0, 0),
  ('evt_seed_demo_show', 'vip', 20, 0, 0),
  ('evt_seed_free_meetup', 'rsvp', 50, 0, 0)
on conflict (event_id, ticket_type_id) do update
set
  capacity = excluded.capacity,
  updated_at = now()
where ticket_inventory.sold_count = 0
  and ticket_inventory.reserved_count = 0;

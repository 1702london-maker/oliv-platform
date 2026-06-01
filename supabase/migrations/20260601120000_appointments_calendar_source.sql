-- Add Google Calendar event ID and booking source to appointments table
alter table appointments
  add column if not exists google_event_id text,
  add column if not exists source text not null default 'website',
  add column if not exists service_label text,
  add column if not exists stylist_name text,
  add column if not exists location_name text,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists confirmed_at timestamptz;

-- source values: website | whatsapp | facebook | instagram
comment on column appointments.source is 'Booking channel: website | whatsapp | facebook | instagram';
comment on column appointments.google_event_id is 'Google Calendar event ID for sync/delete';

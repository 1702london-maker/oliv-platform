do $$ begin
  create type ai_reception_channel as enum ('whatsapp', 'website');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_reception_direction as enum ('inbound', 'outbound', 'internal');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_reception_lead_status as enum ('new', 'collecting_details', 'needs_handover', 'appointment_requested', 'confirmed', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_reception_request_type as enum ('book', 'reschedule', 'cancel', 'question');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_reception_request_status as enum ('new', 'needs_review', 'confirmed', 'declined', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists ai_reception_conversations (
  id uuid primary key default gen_random_uuid(),
  channel ai_reception_channel not null default 'whatsapp',
  provider text not null default 'twilio',
  provider_conversation_id text,
  customer_name text,
  phone_number text not null,
  email text,
  service_interest text,
  preferred_date text,
  lead_status ai_reception_lead_status not null default 'new',
  handover_required boolean not null default false,
  handover_reason text,
  collected_details jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, phone_number)
);

create table if not exists ai_reception_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_reception_conversations(id) on delete cascade,
  direction ai_reception_direction not null,
  body text not null,
  media_urls text[] not null default '{}'::text[],
  provider_message_id text,
  intent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_reception_appointment_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_reception_conversations(id) on delete cascade,
  appointment_id uuid references appointments(id),
  request_type ai_reception_request_type not null default 'book',
  customer_name text,
  email text,
  phone text,
  service_interest text,
  hair_condition text,
  desired_style text,
  hair_length text,
  inspiration_media_urls text[] not null default '{}'::text[],
  preferred_date text,
  preferred_time text,
  status ai_reception_request_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_reception_conversations_last_message_idx
  on ai_reception_conversations (last_message_at desc);

create index if not exists ai_reception_conversations_status_idx
  on ai_reception_conversations (lead_status, handover_required);

create index if not exists ai_reception_messages_conversation_idx
  on ai_reception_messages (conversation_id, created_at);

create index if not exists ai_reception_appointment_requests_status_idx
  on ai_reception_appointment_requests (status, created_at desc);

alter table ai_reception_conversations enable row level security;
alter table ai_reception_messages enable row level security;
alter table ai_reception_appointment_requests enable row level security;

grant all on ai_reception_conversations to service_role;
grant all on ai_reception_messages to service_role;
grant all on ai_reception_appointment_requests to service_role;

comment on table ai_reception_conversations is 'WhatsApp AI Reception lead and conversation state for OlivHairSupply.';
comment on table ai_reception_messages is 'Inbound/outbound WhatsApp AI Reception message history.';
comment on table ai_reception_appointment_requests is 'AI Reception appointment, reschedule, cancel, and question requests requiring admin review.';

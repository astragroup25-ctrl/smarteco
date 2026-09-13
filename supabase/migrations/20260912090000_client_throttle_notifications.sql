-- Ralentissements temporaires et notifications liés à la règle anti-partage.
-- Une MAC ne peut avoir qu'un ralentissement actif : le cron ne peut donc pas
-- prolonger la durée de deux heures à chacun de ses passages.

create table if not exists client_throttles (
  mac_address text primary key,
  voucher_id uuid references vouchers(id) on delete set null,
  slowed_at timestamptz not null default now(),
  slowed_until timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint client_throttles_valid_period check (slowed_until > slowed_at)
);

create index if not exists client_throttles_active_idx
  on client_throttles (slowed_until desc);

create table if not exists client_notifications (
  id bigint generated always as identity primary key,
  voucher_id uuid references vouchers(id) on delete set null,
  numero_client text not null,
  type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists client_notifications_numero_created_idx
  on client_notifications (numero_client, created_at desc);

alter table client_throttles enable row level security;
alter table client_notifications enable row level security;

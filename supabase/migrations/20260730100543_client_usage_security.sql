-- Surveillance anti-partage : suivi de consommation par appareil et
-- historique des actions de sécurité (kick/block) déclenchées par la
-- fonction Edge "monitor-usage".

create table if not exists client_usage (
  id bigint generated always as identity primary key,
  mac_address text not null,
  voucher_code text,
  rx_bytes bigint not null default 0,
  tx_bytes bigint not null default 0,
  session_start timestamptz,
  checked_at timestamptz not null default now()
);

create index if not exists client_usage_mac_checked_idx
  on client_usage (mac_address, checked_at desc);

create table if not exists security_actions (
  id bigint generated always as identity primary key,
  mac_address text not null,
  reason text not null,
  action_taken text not null,
  created_at timestamptz not null default now()
);

create index if not exists security_actions_mac_idx
  on security_actions (mac_address, created_at desc);

-- Seuil de dépassement ajustable directement dans la table (Table Editor
-- Supabase), sans avoir à redéployer la fonction Edge.
create table if not exists security_config (
  id int primary key default 1,
  overage_threshold_mb integer not null default 500,
  updated_at timestamptz not null default now(),
  constraint security_config_single_row check (id = 1)
);

insert into security_config (id, overage_threshold_mb)
values (1, 500)
on conflict (id) do nothing;

-- Tables internes uniquement (écrites par la fonction Edge via la clé
-- service_role, qui contourne RLS) : RLS activé sans policy, donc
-- inaccessibles depuis le client anonyme ou l'app mobile.
alter table client_usage enable row level security;
alter table security_actions enable row level security;
alter table security_config enable row level security;

-- Planification : appelle la fonction Edge "monitor-usage" toutes les
-- 5 minutes via pg_net. Le header Authorization utilise la clé
-- service_role pour satisfaire la vérification JWT de la fonction.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Note : remplacez <VOTRE_SERVICE_ROLE_KEY> ci-dessous par la vraie clé service_role de votre projet
-- Supabase (Settings > API > service_role key). Ne commitez JAMAIS ce fichier avec une vraie clé en clair.
-- Si la clé change, exécutez d'abord : SELECT cron.unschedule('monitor-usage-every-5-min');
-- puis ré-exécutez ce bloc avec la nouvelle clé.
select cron.schedule(
  'monitor-usage-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://bwwhuzowmpmqiilindvv.supabase.co/functions/v1/monitor-usage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <VOTRE_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);


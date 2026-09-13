-- Discussion interne entre administrateurs (accès protégé par le code admin partagé côté
-- application, pas par Supabase Auth — même modèle de sécurité que paiements/vouchers,
-- consultés depuis le dashboard admin avec la clé anon).

create table if not exists admin_messages (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_messages_created_idx on admin_messages (created_at desc);

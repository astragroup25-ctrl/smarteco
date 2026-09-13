-- Espace communauté in-app : discussions entre clients, questions, et
-- mentions de l'administration (@UI-SMART).

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  auth_uid uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null,
  mentions_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  auth_uid uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null,
  is_admin boolean not null default false,
  mentions_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_posts_created_idx
  on community_posts (created_at desc);
create index if not exists community_replies_post_idx
  on community_replies (post_id, created_at);

alter table community_posts enable row level security;
alter table community_replies enable row level security;

-- Lecture publique (visible aussi depuis le panneau admin web, qui n'utilise
-- pas l'authentification Supabase). L'écriture reste réservée aux clients
-- connectés dans l'app ; les réponses de l'administration passent par une
-- route serveur dédiée (clé service_role), pas par cette policy.
create policy "lecture publique des posts" on community_posts
  for select using (true);
create policy "les clients connectes peuvent poster" on community_posts
  for insert with check (auth.uid() = auth_uid);

create policy "lecture publique des reponses" on community_replies
  for select using (true);
create policy "les clients connectes peuvent repondre" on community_replies
  for insert with check (auth.uid() = auth_uid);

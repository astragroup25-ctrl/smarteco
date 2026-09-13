-- Likes (posts et réponses), suppression de ses propres messages par le client, et purge
-- automatique de tout le contenu communauté après 30 jours.

create table if not exists community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references community_posts(id) on delete cascade,
  reply_id uuid references community_replies(id) on delete cascade,
  auth_uid uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_likes_target_check check (
    (post_id is not null and reply_id is null) or (post_id is null and reply_id is not null)
  )
);

-- Un seul like par client et par message (post OU réponse).
create unique index if not exists community_likes_post_unique
  on community_likes (post_id, auth_uid) where post_id is not null;
create unique index if not exists community_likes_reply_unique
  on community_likes (reply_id, auth_uid) where reply_id is not null;

alter table community_likes enable row level security;

create policy "lecture publique des likes" on community_likes
  for select using (true);
create policy "les clients connectes peuvent liker" on community_likes
  for insert with check (auth.uid() = auth_uid);
create policy "les clients peuvent retirer leur propre like" on community_likes
  for delete using (auth.uid() = auth_uid);

-- Suppression de ses propres messages (posts et réponses) — RLS n'avait jusqu'ici que
-- lecture/écriture, aucune policy delete, donc c'était bloqué par défaut.
create policy "les clients peuvent supprimer leurs posts" on community_posts
  for delete using (auth.uid() = auth_uid);
create policy "les clients peuvent supprimer leurs reponses" on community_replies
  for delete using (auth.uid() = auth_uid);

-- Purge automatique : tout contenu communauté de plus de 30 jours est supprimé chaque jour.
-- Les réponses et likes rattachés à un post supprimé partent avec (on delete cascade), donc
-- ne purger que community_posts suffit à nettoyer aussi les réponses orphelines de plus de
-- 30 jours ; on purge en plus les réponses plus récentes que leur post pour rester exact.
create or replace function purge_old_community_content()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from community_replies where created_at < now() - interval '30 days';
  delete from community_posts where created_at < now() - interval '30 days';
end;
$$;

select cron.schedule(
  'purge-community-content-daily',
  '0 4 * * *', -- chaque jour à 04:00 UTC
  $$select purge_old_community_content()$$
);

-- Abonnements Web Push des administrateurs (navigateur/PWA du dashboard admin), et
-- déclencheurs qui notifient automatiquement dès qu'un événement notable survient
-- (nouveau paiement, nouveau message ou réponse communauté) — évite de dépendre de
-- chaque point d'entrée client pour se souvenir d'appeler l'API de notification.

create table if not exists admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Accès restreint : ni lecture ni écriture publique. La page admin utilise une route
-- serveur (clé service_role) pour s'abonner, jamais un accès direct depuis le navigateur.
alter table admin_push_subscriptions enable row level security;

create or replace function notify_admin_webhook(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Secret partagé en clair ici (même schéma que le cron monitor-usage) : simple à
  -- exploiter pour une fonction interne appelée uniquement par nos propres triggers.
  perform net.http_post(
    url := 'https://wifi.empirebiblio.com/api/push/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', '72325a4d6e659d0a4d96ecabe30b6f138f40db7e2bbb7d08'
    ),
    body := payload
  );
end;
$$;

create or replace function trg_notify_admin_new_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notify_admin_webhook(jsonb_build_object('type', 'new_payment', 'numero_client', new.numero_client));
  return new;
end;
$$;

create or replace function trg_notify_admin_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notify_admin_webhook(jsonb_build_object('type', 'new_post', 'author_name', new.author_name, 'body', left(new.body, 120)));
  return new;
end;
$$;

create or replace function trg_notify_admin_new_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin then
    return new; -- pas besoin de notifier l'admin de ses propres réponses
  end if;
  perform notify_admin_webhook(jsonb_build_object('type', 'new_reply', 'author_name', new.author_name, 'body', left(new.body, 120)));
  return new;
end;
$$;

drop trigger if exists notify_admin_new_payment on paiements;
create trigger notify_admin_new_payment
after insert on paiements
for each row execute function trg_notify_admin_new_payment();

drop trigger if exists notify_admin_new_post on community_posts;
create trigger notify_admin_new_post
after insert on community_posts
for each row execute function trg_notify_admin_new_post();

drop trigger if exists notify_admin_new_reply on community_replies;
create trigger notify_admin_new_reply
after insert on community_replies
for each row execute function trg_notify_admin_new_reply();

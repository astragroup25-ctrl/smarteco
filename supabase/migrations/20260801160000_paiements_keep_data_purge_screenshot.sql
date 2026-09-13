-- Révision : les lignes `paiements` (données extraites par l'IA : montant, date, expéditeur,
-- statut, code_transaction, image_hash) sont conservées indéfiniment pour la détection de
-- fraude au-delà de 7 jours — seule la CAPTURE elle-même (fichier image) est supprimée après
-- 7 jours, via la nouvelle fonction Edge purge-screenshots (cron ci-dessous).
--
-- On retire donc la suppression de `paiements` (et le détachement de vouchers.paiement_id,
-- devenu inutile) de purge_old_transient_data — les autres tables (client_usage,
-- security_actions, admin_messages) restent purgées intégralement après 7 jours.

create or replace function purge_old_transient_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from client_usage where checked_at < now() - interval '7 days';
  delete from security_actions where created_at < now() - interval '7 days';
  delete from admin_messages where created_at < now() - interval '7 days';
end;
$$;

-- Remplacez <VOTRE_SERVICE_ROLE_KEY> par la clé service_role du projet avant
-- d'exécuter cette planification. Ne commitez jamais une clé réelle en clair.
select cron.schedule(
  'purge-screenshots-daily',
  '0 5 * * *', -- chaque jour à 05:00 UTC
  $$
  select net.http_post(
    url := 'https://bwwhuzowmpmqiilindvv.supabase.co/functions/v1/purge-screenshots',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <VOTRE_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);

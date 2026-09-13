-- Nettoyage automatique quotidien des données passagères (plus de 7 jours), à l'exception
-- explicite des vouchers (historique d'abonnement du client, affiché dans son espace —
-- ne doit jamais être purgé) et du contenu communauté (qui a déjà sa propre purge à 30 jours,
-- migration 20260801120000).
--
-- Tables couvertes ici :
--   - paiements        : soumissions de paiement (captures, statuts) — artefacts de traitement,
--                        pas des données de compte.
--   - client_usage     : historique de consommation (surveillance anti-partage).
--   - security_actions : journal des kick/block automatiques.
--   - admin_messages   : discussion interne entre administrateurs.
--
-- Non couverts volontairement : admin_push_subscriptions et device_tokens (état d'abonnement
-- actif, pas un historique d'événements — les supprimer casserait les notifications d'un
-- admin/client qui n'a pas rouvert l'app depuis plus de 7 jours).

create or replace function purge_old_transient_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Détache d'abord les vouchers des paiements sur le point d'être supprimés, pour ne pas
  -- casser la contrainte de clé étrangère vouchers.paiement_id -> paiements.id.
  update vouchers
  set paiement_id = null
  where paiement_id in (select id from paiements where created_at < now() - interval '7 days');

  delete from paiements where created_at < now() - interval '7 days';
  delete from client_usage where checked_at < now() - interval '7 days';
  delete from security_actions where created_at < now() - interval '7 days';
  delete from admin_messages where created_at < now() - interval '7 days';
end;
$$;

select cron.schedule(
  'purge-transient-data-daily',
  '30 4 * * *', -- chaque jour à 04:30 UTC (juste après la purge communauté à 04:00)
  $$select purge_old_transient_data()$$
);

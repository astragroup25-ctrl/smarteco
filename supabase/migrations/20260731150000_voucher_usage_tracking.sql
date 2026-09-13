-- Colonne servant à savoir si mb_utilises_jour correspond bien à "aujourd'hui" ou doit être
-- réinitialisé : monitor-usage compare cette date à la date du jour à chaque cycle (5 min).
alter table vouchers add column if not exists mb_utilises_jour_date date default current_date;

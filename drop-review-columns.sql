-- Script pour supprimer les colonnes nécessitant une review
-- ⚠️⚠️⚠️ ATTENTION: REVIEW MANUELLE REQUISE AVANT EXÉCUTION !
-- Date: 2025-08-18T15:21:24.141Z

-- ÉTAPE 1: Examiner les données existantes
-- dune_mroi: Métrique Dune potentiellement obsolète, mais pourrait être utilisée dans des rapports
SELECT 'dune_mroi' as colonne, COUNT(*) as total_rows, COUNT(dune_mroi) as non_null_rows, COUNT(DISTINCT dune_mroi) as distinct_values FROM wallet_registry;
-- dune_invalids: Compteur d'erreurs Dune - utile pour debugging mais peut être obsolète
SELECT 'dune_invalids' as colonne, COUNT(*) as total_rows, COUNT(dune_invalids) as non_null_rows, COUNT(DISTINCT dune_invalids) as distinct_values FROM wallet_registry;
-- streak_wins_max_90d: Métriques de streaks - pourraient être utilisées dans des analyses avancées
SELECT 'streak_wins_max_90d' as colonne, COUNT(*) as total_rows, COUNT(streak_wins_max_90d) as non_null_rows, COUNT(DISTINCT streak_wins_max_90d) as distinct_values FROM wallet_registry;
-- streak_losses_max_90d: Métriques de streaks - pourraient être utilisées dans des analyses avancées
SELECT 'streak_losses_max_90d' as colonne, COUNT(*) as total_rows, COUNT(streak_losses_max_90d) as non_null_rows, COUNT(DISTINCT streak_losses_max_90d) as distinct_values FROM wallet_registry;

-- ÉTAPE 2: Si les données sont obsolètes, décommentez les lignes suivantes
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS dune_mroi;
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS dune_invalids;
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS streak_wins_max_90d;
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS streak_losses_max_90d;

-- ⚠️  SUPPRESSION APRÈS REVIEW - Colonnes à examiner manuellement
-- =============================================================
-- ⚠️⚠️⚠️ ATTENTION: REVIEW MANUELLE OBLIGATOIRE !
-- Date: 2025-08-18T15:24:07.407Z

-- ÉTAPE 1: Examiner les données de ces colonnes
SELECT 'dune_mroi' as colonne, COUNT(*) as total, COUNT(dune_mroi) as rempli, COUNT(DISTINCT dune_mroi) as distincts FROM wallet_registry;
SELECT 'dune_invalids' as colonne, COUNT(*) as total, COUNT(dune_invalids) as rempli, COUNT(DISTINCT dune_invalids) as distincts FROM wallet_registry;
SELECT 'streak_wins_max_90d' as colonne, COUNT(*) as total, COUNT(streak_wins_max_90d) as rempli, COUNT(DISTINCT streak_wins_max_90d) as distincts FROM wallet_registry;
SELECT 'streak_losses_max_90d' as colonne, COUNT(*) as total, COUNT(streak_losses_max_90d) as rempli, COUNT(DISTINCT streak_losses_max_90d) as distincts FROM wallet_registry;

-- ÉTAPE 2: Si les données sont obsolètes, décommentez ci-dessous

-- Sauvegarder avant suppression
-- CREATE TABLE wallet_registry_review_backup AS SELECT * FROM wallet_registry;

-- Supprimer les colonnes (décommentez si nécessaire)
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS dune_mroi;
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS dune_invalids;
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS streak_wins_max_90d;
-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS streak_losses_max_90d;

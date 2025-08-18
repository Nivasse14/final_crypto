-- 🗑️  SUPPRESSION SÛRE - Colonnes non utilisées identifiées
-- ===================================================
-- Date: 2025-08-18T15:24:07.406Z
-- Colonnes à supprimer: 11
-- ⚠️  SAUVEGARDE OBLIGATOIRE avant exécution !

-- ÉTAPE 1: Sauvegarde de sécurité
CREATE TABLE wallet_registry_backup_20250818 AS 
SELECT * FROM wallet_registry;

-- ÉTAPE 2: Vérification des colonnes avant suppression
SELECT 
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE pnl_total_volume_24h_usd IS NOT NULL OR pnl_avg_volume_24h_usd IS NOT NULL OR pnl_tokens_with_volume_data IS NOT NULL OR portfolio_total_volume_24h_usd IS NOT NULL OR portfolio_avg_volume_24h_usd IS NOT NULL OR portfolio_tokens_with_volume_data IS NOT NULL OR roi_50_to_200 IS NOT NULL OR roi_0_to_50 IS NOT NULL OR roi_total_trades IS NOT NULL OR roi_winning_trades IS NOT NULL OR roi_losing_trades IS NOT NULL) as rows_with_data
FROM wallet_registry;

-- ÉTAPE 3: Suppression des colonnes sûres
-- (Colonnes uniquement en lecture, jamais mises à jour)

-- Volume metrics PnL (non maintenues)
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS pnl_total_volume_24h_usd;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS pnl_avg_volume_24h_usd;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS pnl_tokens_with_volume_data;

-- Volume metrics Portfolio (non maintenues)
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS portfolio_total_volume_24h_usd;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS portfolio_avg_volume_24h_usd;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS portfolio_tokens_with_volume_data;

-- ROI Distribution (obsolètes)
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_50_to_200;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_0_to_50;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_total_trades;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_winning_trades;
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_losing_trades;

-- ÉTAPE 4: Vérification post-suppression
SELECT 
  table_name,
  COUNT(*) as colonnes_restantes
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
GROUP BY table_name;

SELECT '✅ Suppression des colonnes sûres terminée!' as status;

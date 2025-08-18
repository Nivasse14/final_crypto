-- Script pour supprimer les colonnes identifiées comme sûres
-- Date: 2025-08-18T15:21:24.141Z
-- Colonnes: 11
-- ⚠️  SAUVEGARDE OBLIGATOIRE !

-- ÉTAPE 1: Sauvegarde
CREATE TABLE wallet_registry_safe_backup AS SELECT * FROM wallet_registry;

-- ÉTAPE 2: Suppression des colonnes sûres
-- pnl_total_volume_24h_usd - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS pnl_total_volume_24h_usd;
-- pnl_avg_volume_24h_usd - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS pnl_avg_volume_24h_usd;
-- pnl_tokens_with_volume_data - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS pnl_tokens_with_volume_data;
-- portfolio_total_volume_24h_usd - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS portfolio_total_volume_24h_usd;
-- portfolio_avg_volume_24h_usd - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS portfolio_avg_volume_24h_usd;
-- portfolio_tokens_with_volume_data - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS portfolio_tokens_with_volume_data;
-- roi_50_to_200 - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_50_to_200;
-- roi_0_to_50 - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_0_to_50;
-- roi_total_trades - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_total_trades;
-- roi_winning_trades - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_winning_trades;
-- roi_losing_trades - Métrique de volume/ROI obsolète
ALTER TABLE wallet_registry DROP COLUMN IF EXISTS roi_losing_trades;

-- ÉTAPE 3: Vérification
SELECT COUNT(*) as colonnes_restantes FROM information_schema.columns WHERE table_name = 'wallet_registry';

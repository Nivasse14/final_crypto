-- Migration pour ajouter les nouvelles métriques de l'API Cielo
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les nouvelles colonnes métriques de l'API Cielo
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS average_holding_time NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_pnl NUMERIC(20,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS winrate NUMERIC(6,4) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_roi_percentage NUMERIC(10,4) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS swap_count INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS first_swap_timestamp TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS last_swap_timestamp TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS unique_trading_days INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS consecutive_trading_days INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS average_trades_per_token NUMERIC(8,2) DEFAULT NULL;

-- Ajouter les nouvelles métriques depuis pnl_data
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_tokens_traded INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_unrealized_pnl_usd NUMERIC(20,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_unrealized_roi_percentage NUMERIC(10,4) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_pnl_usd NUMERIC(20,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_roi_percentage NUMERIC(10,4) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_average_hold_time NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_median_hold_time NUMERIC(12,2) DEFAULT NULL;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN wallet_registry.average_holding_time IS 'Temps de détention moyen en heures (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_pnl IS 'PnL total en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.winrate IS 'Taux de réussite 0-1 (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_roi_percentage IS 'ROI total en pourcentage (API Cielo)';
COMMENT ON COLUMN wallet_registry.swap_count IS 'Nombre total de swaps (API Cielo)';
COMMENT ON COLUMN wallet_registry.first_swap_timestamp IS 'Timestamp du premier swap (API Cielo)';
COMMENT ON COLUMN wallet_registry.last_swap_timestamp IS 'Timestamp du dernier swap (API Cielo)';
COMMENT ON COLUMN wallet_registry.unique_trading_days IS 'Nombre de jours de trading uniques (API Cielo)';
COMMENT ON COLUMN wallet_registry.consecutive_trading_days IS 'Jours de trading consécutifs (API Cielo)';
COMMENT ON COLUMN wallet_registry.average_trades_per_token IS 'Nombre moyen de trades par token (API Cielo)';

-- Commentaires pour les nouvelles métriques pnl_data
COMMENT ON COLUMN wallet_registry.total_tokens_traded IS 'Nombre total de tokens tradés (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_unrealized_pnl_usd IS 'PnL non réalisé en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_unrealized_roi_percentage IS 'ROI non réalisé en pourcentage (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_pnl_usd IS 'PnL combiné (réalisé + non réalisé) en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_roi_percentage IS 'ROI combiné en pourcentage (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_average_hold_time IS 'Temps de détention moyen combiné en heures (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_median_hold_time IS 'Temps de détention médian combiné en heures (API Cielo)';

-- Vérification complète
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
AND column_name IN (
  'average_holding_time', 'total_pnl', 'winrate', 'total_roi_percentage', 
  'swap_count', 'first_swap_timestamp', 'last_swap_timestamp', 
  'unique_trading_days', 'consecutive_trading_days', 'average_trades_per_token',
  'total_tokens_traded', 'total_unrealized_pnl_usd', 'total_unrealized_roi_percentage',
  'combined_pnl_usd', 'combined_roi_percentage', 'combined_average_hold_time', 'combined_median_hold_time'
)
ORDER BY column_name;

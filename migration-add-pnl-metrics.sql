-- Migration pour ajouter les nouvelles métriques pnl_data
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_tokens_traded INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_unrealized_pnl_usd NUMERIC(20,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_unrealized_roi_percentage NUMERIC(10,4) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_pnl_usd NUMERIC(20,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_roi_percentage NUMERIC(10,4) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_average_hold_time NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_median_hold_time NUMERIC(12,2) DEFAULT NULL;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN wallet_registry.total_tokens_traded IS 'Nombre total de tokens tradés (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_unrealized_pnl_usd IS 'PnL non réalisé en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_unrealized_roi_percentage IS 'ROI non réalisé en pourcentage (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_pnl_usd IS 'PnL combiné (réalisé + non réalisé) en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_roi_percentage IS 'ROI combiné en pourcentage (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_average_hold_time IS 'Temps de détention moyen combiné en heures (API Cielo)';
COMMENT ON COLUMN wallet_registry.combined_median_hold_time IS 'Temps de détention médian combiné en heures (API Cielo)';

-- Vérification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
AND column_name IN (
  'total_tokens_traded',
  'total_unrealized_pnl_usd',
  'total_unrealized_roi_percentage',
  'combined_pnl_usd',
  'combined_roi_percentage',
  'combined_average_hold_time',
  'combined_median_hold_time'
)
ORDER BY column_name;

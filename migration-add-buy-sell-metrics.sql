-- Migration pour ajouter les métriques d'achat et de vente depuis l'API Cielo
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les nouvelles colonnes métriques d'achat et de vente
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS average_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS minimum_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS maximum_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_buy_count INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS average_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS minimum_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS maximum_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_sell_count INTEGER DEFAULT NULL;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN wallet_registry.average_buy_amount_usd IS 'Montant moyen d''achat en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.minimum_buy_amount_usd IS 'Montant minimum d''achat en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.maximum_buy_amount_usd IS 'Montant maximum d''achat en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_buy_amount_usd IS 'Montant total d''achat en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_buy_count IS 'Nombre total d''achats (API Cielo)';
COMMENT ON COLUMN wallet_registry.average_sell_amount_usd IS 'Montant moyen de vente en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.minimum_sell_amount_usd IS 'Montant minimum de vente en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.maximum_sell_amount_usd IS 'Montant maximum de vente en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_sell_amount_usd IS 'Montant total de vente en USD (API Cielo)';
COMMENT ON COLUMN wallet_registry.total_sell_count IS 'Nombre total de ventes (API Cielo)';

-- Vérification des nouvelles colonnes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
AND column_name IN (
  'average_buy_amount_usd', 'minimum_buy_amount_usd', 'maximum_buy_amount_usd',
  'total_buy_amount_usd', 'total_buy_count',
  'average_sell_amount_usd', 'minimum_sell_amount_usd', 'maximum_sell_amount_usd',
  'total_sell_amount_usd', 'total_sell_count'
)
ORDER BY column_name;

-- Test de la structure finale
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
AND column_name LIKE '%buy%' OR column_name LIKE '%sell%';

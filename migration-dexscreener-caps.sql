-- Migration pour ajouter les colonnes de métriques DexScreener détaillées
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les colonnes de métriques DexScreener par market cap
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_micro_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_low_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_middle_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_large_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_mega_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_unknown_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_total_analyzed_count INTEGER DEFAULT 0;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN wallet_registry.dexscreener_micro_cap_count IS 'Nombre de tokens avec market cap < 1M USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_low_cap_count IS 'Nombre de tokens avec market cap 1M-10M USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_middle_cap_count IS 'Nombre de tokens avec market cap 10M-100M USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_large_cap_count IS 'Nombre de tokens avec market cap 100M-1B USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_mega_cap_count IS 'Nombre de tokens avec market cap > 1B USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_unknown_cap_count IS 'Nombre de tokens sans données market cap (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_total_analyzed_count IS 'Nombre total de tokens analysés par DexScreener';

-- Vérification
SELECT 'Migration terminée - Nouvelles colonnes DexScreener ajoutées' as status;

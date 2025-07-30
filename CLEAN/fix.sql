-- CORRECTION SIMPLE DU SCHÉMA
-- Copiez ce code dans le SQL Editor Supabase et exécutez

-- 1. Supprimer toutes les vues qui bloquent
DROP VIEW IF EXISTS wallet_summary CASCADE;
DROP VIEW IF EXISTS top_performing_wallets_extended CASCADE; 
DROP VIEW IF EXISTS wallet_trading_stats CASCADE;
DROP VIEW IF EXISTS top_token_performers CASCADE;
DROP MATERIALIZED VIEW IF EXISTS top_performing_wallets_extended CASCADE;

-- 2. Agrandir les colonnes problématiques
ALTER TABLE wallet_tokens_extended ALTER COLUMN token_address TYPE VARCHAR(100);
ALTER TABLE wallet_tokens_extended ALTER COLUMN wallet_address TYPE VARCHAR(100);
ALTER TABLE wallet_tokens_extended ALTER COLUMN gt_address TYPE VARCHAR(100);
ALTER TABLE wallet_tokens_extended ALTER COLUMN raw_pnl_history TYPE TEXT;

-- 3. Autres tables si elles existent
ALTER TABLE wallets_extended ALTER COLUMN wallet_address TYPE VARCHAR(100);
ALTER TABLE wallet_registry ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- 4. Test de fonctionnement
SELECT 'CORRECTION APPLIQUÉE AVEC SUCCÈS !' as status;

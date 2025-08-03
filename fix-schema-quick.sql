-- Script de correction rapide pour les contraintes d'adresses Solana
-- À exécuter dans le SQL Editor de Supabase

-- 1. Supprimer toutes les vues dépendantes (temporairement)
DROP VIEW IF EXISTS top_performing_wallets_extended CASCADE;
DROP VIEW IF EXISTS wallet_trading_stats CASCADE;
DROP VIEW IF EXISTS top_token_performers CASCADE;
DROP VIEW IF EXISTS wallet_performance_summary CASCADE;
DROP VIEW IF EXISTS token_analysis CASCADE;

-- 2. Modifier les contraintes des colonnes d'adresses
-- Table tokens
ALTER TABLE tokens 
  ALTER COLUMN token_address TYPE VARCHAR(100),
  ALTER COLUMN gt_address TYPE VARCHAR(100);

-- Table wallets  
ALTER TABLE wallets
  ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Table wallet_tokens
ALTER TABLE wallet_tokens
  ALTER COLUMN wallet_address TYPE VARCHAR(100),
  ALTER COLUMN token_address TYPE VARCHAR(100);

-- Table transactions (si elle existe)
ALTER TABLE transactions
  ALTER COLUMN wallet_address TYPE VARCHAR(100),
  ALTER COLUMN token_address TYPE VARCHAR(100);

-- 3. Modifier les colonnes JSON qui peuvent être trop longues
ALTER TABLE tokens
  ALTER COLUMN raw_pnl_history TYPE TEXT,
  ALTER COLUMN geckoterminal_complete_data TYPE TEXT,
  ALTER COLUMN security_data TYPE TEXT;

-- 4. Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet ON wallet_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token_address);

-- 5. Recréer les vues essentielles (optionnel)
CREATE OR REPLACE VIEW wallet_performance_summary AS
SELECT 
  wallet_address,
  COUNT(*) as total_tokens,
  COALESCE(AVG(total_pnl_usd), 0) as avg_pnl,
  COALESCE(SUM(total_pnl_usd), 0) as total_pnl,
  COALESCE(AVG(roi_percentage), 0) as avg_roi
FROM wallet_tokens 
WHERE total_pnl_usd IS NOT NULL 
GROUP BY wallet_address;

-- Confirmation
SELECT 'Schema correction completed successfully' as status;

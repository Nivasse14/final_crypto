-- Script pour corriger les types de colonnes dans la base de données
-- Erreur: "invalid input syntax for type integer: 48.055045871559635"

-- 1. Vérifier les colonnes problématiques dans les tables tokens et wallets
\d wallet_tokens;
\d wallet_registry;

-- 2. Corriger les types de colonnes qui devraient être DECIMAL/NUMERIC au lieu d'INTEGER

-- Pour la table wallet_tokens
ALTER TABLE wallet_tokens 
  ALTER COLUMN balance TYPE DECIMAL(20,8),
  ALTER COLUMN token_price_usd TYPE DECIMAL(20,8),
  ALTER COLUMN total_usd_value TYPE DECIMAL(20,2),
  ALTER COLUMN portfolio_weight_pct TYPE DECIMAL(8,4),
  ALTER COLUMN price_change_24h TYPE DECIMAL(8,4),
  ALTER COLUMN pnl TYPE DECIMAL(20,2),
  ALTER COLUMN pnl_percentage TYPE DECIMAL(8,4);

-- Pour la table wallet_registry (si nécessaire)
ALTER TABLE wallet_registry 
  ALTER COLUMN total_pnl_usd TYPE DECIMAL(20,2),
  ALTER COLUMN total_bought_usd TYPE DECIMAL(20,2),
  ALTER COLUMN roi TYPE DECIMAL(8,4),
  ALTER COLUMN winrate TYPE DECIMAL(8,4);

-- Pour la table token_enrichment_data (si elle existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'token_enrichment_data') THEN
    ALTER TABLE token_enrichment_data 
      ALTER COLUMN market_cap_usd TYPE DECIMAL(20,2),
      ALTER COLUMN calculated_market_cap_usd TYPE DECIMAL(20,2),
      ALTER COLUMN circulating_supply TYPE DECIMAL(20,2),
      ALTER COLUMN price_usd TYPE DECIMAL(20,8),
      ALTER COLUMN price_change_1h TYPE DECIMAL(8,4),
      ALTER COLUMN price_change_24h TYPE DECIMAL(8,4),
      ALTER COLUMN price_change_7d TYPE DECIMAL(8,4),
      ALTER COLUMN volume_24h_usd TYPE DECIMAL(20,2),
      ALTER COLUMN volume_24h_change TYPE DECIMAL(8,4),
      ALTER COLUMN liquidity_usd TYPE DECIMAL(20,2),
      ALTER COLUMN fdv TYPE DECIMAL(20,2),
      ALTER COLUMN top_10_holder_percent TYPE DECIMAL(8,4),
      ALTER COLUMN locked_percent TYPE DECIMAL(8,4),
      ALTER COLUMN buy_tax TYPE DECIMAL(8,6),
      ALTER COLUMN sell_tax TYPE DECIMAL(8,6);
  END IF;
END $$;

-- Vérifier les corrections
\d wallet_tokens;
\d wallet_registry;

-- Message de confirmation
SELECT 'Types de colonnes corrigés avec succès!' as status;

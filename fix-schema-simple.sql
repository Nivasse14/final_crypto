-- Correction simple du schéma pour scanDune
-- Copiez-collez ce code dans Supabase SQL Editor

-- Agrandir les colonnes d'adresses pour supporter Solana (46 caractères)
ALTER TABLE wallet_registry 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Ajouter metadata à wallet_registry
ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Agrandir les adresses dans wallet_tokens  
ALTER TABLE wallet_tokens 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

ALTER TABLE wallet_tokens 
ALTER COLUMN token_address TYPE VARCHAR(100);

-- Ajouter les colonnes manquantes à wallet_tokens
ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS roi_percentage DECIMAL(10,4) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS calculated_market_cap_usd DECIMAL(30,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(8,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS liquidity_locked_percent DECIMAL(8,4);

-- Vérification finale
SELECT 'Schema correction complete! 🎉' as status;
-- Correction COMPLÈTE du schéma pour scanDune
-- Copiez-collez ce code dans Supabase SQL Editor

-- ================================================
-- ÉTAPE 1: Corriger wallet_registry
-- ================================================

-- Agrandir wallet_address
ALTER TABLE wallet_registry 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Ajouter toutes les colonnes manquantes dans wallet_registry
ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS total_pnl_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS total_bought_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS roi DECIMAL(8,4) DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS winrate DECIMAL(8,4) DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS tokens_traded INTEGER DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS trade_count INTEGER DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS last_trade_date TIMESTAMPTZ;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'unknown';

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS processing_attempts INTEGER DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMPTZ;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ================================================
-- ÉTAPE 2: Corriger wallet_tokens
-- ================================================

-- Agrandir les adresses
ALTER TABLE wallet_tokens 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

ALTER TABLE wallet_tokens 
ALTER COLUMN token_address TYPE VARCHAR(100);

-- Ajouter toutes les colonnes manquantes dans wallet_tokens
ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS chain VARCHAR(20) DEFAULT 'solana';

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS hold_time INTEGER;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS num_swaps INTEGER;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS chart_link TEXT;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS last_trade BIGINT;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS first_trade BIGINT;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS is_honeypot BOOLEAN DEFAULT FALSE;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS total_buy_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS total_pnl_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS holding_amount DECIMAL(30,8) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS roi_percentage DECIMAL(10,4) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS total_sell_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS token_price_usd DECIMAL(20,8) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS total_buy_amount DECIMAL(30,8) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS average_buy_price DECIMAL(20,8) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS total_sell_amount DECIMAL(30,8) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS average_sell_price DECIMAL(20,8) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS holding_amount_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS unrealized_pnl_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS geckoterminal_enriched BOOLEAN DEFAULT FALSE;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS unrealized_roi_percentage DECIMAL(10,4) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS market_cap_usd DECIMAL(30,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS calculated_market_cap_usd DECIMAL(30,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS circulating_supply DECIMAL(30,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(8,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS liquidity_locked_percent DECIMAL(8,4);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS security_data TEXT;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS geckoterminal_complete_data TEXT;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS raw_pnl_history TEXT;

-- ================================================
-- ÉTAPE 3: Créer les index de base
-- ================================================

CREATE INDEX IF NOT EXISTS idx_wallet_registry_address ON wallet_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet ON wallet_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_roi ON wallet_tokens(roi_percentage);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_market_cap ON wallet_tokens(market_cap_usd);

-- ================================================
-- ÉTAPE 4: Vérification finale
-- ================================================

SELECT 'Schema correction COMPLETE! 🎉' as status;

-- Vérifier que toutes les colonnes existent
SELECT 
    'wallet_registry' as table_name,
    count(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'wallet_registry'
UNION ALL
SELECT 
    'wallet_tokens' as table_name,
    count(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'wallet_tokens';

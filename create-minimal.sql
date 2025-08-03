-- Script ultra-simple: juste les tables essentielles
-- Aucun risque d'erreur de colonnes manquantes

-- Supprimer toutes les vues d'abord
DROP VIEW IF EXISTS top_performing_wallets_extended CASCADE;
DROP VIEW IF EXISTS wallet_trading_stats CASCADE;
DROP VIEW IF EXISTS top_token_performers CASCADE;
DROP VIEW IF EXISTS wallet_performance_summary CASCADE;
DROP VIEW IF EXISTS token_analysis CASCADE;

-- 1. Table principale des wallets
CREATE TABLE IF NOT EXISTS wallet_registry (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(100) UNIQUE NOT NULL,
    total_pnl_usd DECIMAL(20,2) DEFAULT 0,
    total_bought_usd DECIMAL(20,2) DEFAULT 0,
    roi DECIMAL(8,4) DEFAULT 0,
    winrate DECIMAL(8,4) DEFAULT 0,
    tokens_traded INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    trade_count INTEGER DEFAULT 0,
    last_trade_date TIMESTAMPTZ,
    source VARCHAR(50) DEFAULT 'unknown',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processing_attempts INTEGER DEFAULT 0,
    last_processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Table des tokens par wallet - TOUS LES CHAMPS NÉCESSAIRES
CREATE TABLE IF NOT EXISTS wallet_tokens (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(100) NOT NULL,
    token_address VARCHAR(100) NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    chain VARCHAR(20) DEFAULT 'solana',
    hold_time INTEGER,
    num_swaps INTEGER,
    chart_link TEXT,
    last_trade BIGINT,
    first_trade BIGINT,
    is_honeypot BOOLEAN DEFAULT FALSE,
    total_buy_usd DECIMAL(20,2) DEFAULT 0,
    total_pnl_usd DECIMAL(20,2) DEFAULT 0,
    holding_amount DECIMAL(30,8) DEFAULT 0,
    roi_percentage DECIMAL(10,4) DEFAULT 0,
    total_sell_usd DECIMAL(20,2) DEFAULT 0,
    token_price_usd DECIMAL(20,8) DEFAULT 0,
    total_buy_amount DECIMAL(30,8) DEFAULT 0,
    average_buy_price DECIMAL(20,8) DEFAULT 0,
    total_sell_amount DECIMAL(30,8) DEFAULT 0,
    average_sell_price DECIMAL(20,8) DEFAULT 0,
    holding_amount_usd DECIMAL(20,2) DEFAULT 0,
    unrealized_pnl_usd DECIMAL(20,2) DEFAULT 0,
    geckoterminal_enriched BOOLEAN DEFAULT FALSE,
    unrealized_roi_percentage DECIMAL(10,4) DEFAULT 0,
    market_cap_usd DECIMAL(30,2),
    calculated_market_cap_usd DECIMAL(30,2),
    circulating_supply DECIMAL(30,2),
    reliability_score DECIMAL(8,2),
    liquidity_locked_percent DECIMAL(8,4),
    security_data TEXT,
    geckoterminal_complete_data TEXT,
    raw_pnl_history TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, token_address)
);

-- 3. Index de base seulement (sûrs)
CREATE INDEX IF NOT EXISTS idx_wallet_registry_address ON wallet_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet ON wallet_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token_address);

-- Corriger les tables existantes si nécessaire
DO $$ 
BEGIN
    -- Corriger wallet_registry si elle existe avec varchar trop petit
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_registry' 
        AND column_name = 'wallet_address' 
        AND character_maximum_length < 100
    ) THEN
        ALTER TABLE wallet_registry ALTER COLUMN wallet_address TYPE VARCHAR(100);
        RAISE NOTICE '✅ wallet_registry.wallet_address → VARCHAR(100)';
    END IF;
    
    -- Corriger wallet_tokens si elle existe avec varchar trop petit
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_tokens') THEN
        -- wallet_address
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' 
            AND column_name = 'wallet_address' 
            AND character_maximum_length < 100
        ) THEN
            ALTER TABLE wallet_tokens ALTER COLUMN wallet_address TYPE VARCHAR(100);
            RAISE NOTICE '✅ wallet_tokens.wallet_address → VARCHAR(100)';
        END IF;
        
        -- token_address
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' 
            AND column_name = 'token_address' 
            AND character_maximum_length < 100
        ) THEN
            ALTER TABLE wallet_tokens ALTER COLUMN token_address TYPE VARCHAR(100);
            RAISE NOTICE '✅ wallet_tokens.token_address → VARCHAR(100)';
        END IF;
    END IF;
    
    RAISE NOTICE '🚀 Tables créées/corrigées avec succès!';
END $$;

-- Test et confirmation
SELECT 'SUCCESS: Base de données prête! 🎉' as status;

-- Vérifier les tables créées
SELECT 
    tablename as table_name,
    '✅ Créée' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('wallet_registry', 'wallet_tokens')
ORDER BY tablename;

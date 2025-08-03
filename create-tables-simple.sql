-- Script simple de création des tables UNIQUEMENT
-- Pour éviter les erreurs de colonnes manquantes
-- À exécuter dans le SQL Editor de Supabase

-- ===============================================
-- SUPPRIMER LES VUES EXISTANTES
-- ===============================================
DROP VIEW IF EXISTS top_performing_wallets_extended CASCADE;
DROP VIEW IF EXISTS wallet_trading_stats CASCADE;
DROP VIEW IF EXISTS top_token_performers CASCADE;
DROP VIEW IF EXISTS wallet_performance_summary CASCADE;
DROP VIEW IF EXISTS token_analysis CASCADE;

-- ===============================================
-- CRÉER LES TABLES PRINCIPALES
-- ===============================================

-- 1. Table wallet_registry
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

-- 2. Table wallet_tokens (avec toutes les colonnes nécessaires)
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
    -- Colonnes supplémentaires pour le Market Cap Analyzer
    reliability_score DECIMAL(8,2),
    liquidity_locked_percent DECIMAL(8,4),
    security_data TEXT,
    geckoterminal_complete_data TEXT,
    raw_pnl_history TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, token_address)
);

-- 3. Table token_enrichment_data
CREATE TABLE IF NOT EXISTS token_enrichment_data (
    id BIGSERIAL PRIMARY KEY,
    token_address VARCHAR(100) UNIQUE NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    market_cap_usd DECIMAL(30,2),
    calculated_market_cap_usd DECIMAL(30,2),
    circulating_supply DECIMAL(30,2),
    price_usd DECIMAL(20,8),
    price_change_1h DECIMAL(8,4),
    price_change_24h DECIMAL(8,4),
    price_change_7d DECIMAL(8,4),
    volume_24h_usd DECIMAL(20,2),
    volume_24h_change DECIMAL(8,4),
    liquidity_usd DECIMAL(20,2),
    fdv DECIMAL(30,2),
    top_10_holder_percent DECIMAL(8,4),
    locked_percent DECIMAL(8,4),
    buy_tax DECIMAL(8,6),
    sell_tax DECIMAL(8,6),
    security_score INTEGER,
    reliability_score INTEGER,
    on_coingecko BOOLEAN DEFAULT FALSE,
    enrichment_source VARCHAR(50),
    geckoterminal_complete_data TEXT,
    security_data TEXT,
    raw_pnl_history TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table batch_processing_logs
CREATE TABLE IF NOT EXISTS batch_processing_logs (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    wallet_addresses TEXT[],
    batch_size INTEGER,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    processing_time_ms INTEGER,
    errors JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. Table api_performance_logs
CREATE TABLE IF NOT EXISTS api_performance_logs (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    wallet_address VARCHAR(100),
    response_time_ms INTEGER,
    status_code INTEGER,
    success BOOLEAN,
    error_message TEXT,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- CORRIGER LES TABLES EXISTANTES
-- ===============================================

-- Corriger wallet_registry
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_registry' 
        AND column_name = 'wallet_address' 
        AND character_maximum_length < 100
    ) THEN
        ALTER TABLE wallet_registry ALTER COLUMN wallet_address TYPE VARCHAR(100);
        RAISE NOTICE 'wallet_registry.wallet_address corrigé vers VARCHAR(100)';
    END IF;
END $$;

-- Corriger wallet_tokens
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_tokens') THEN
        -- Corriger wallet_address
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' 
            AND column_name = 'wallet_address' 
            AND character_maximum_length < 100
        ) THEN
            ALTER TABLE wallet_tokens ALTER COLUMN wallet_address TYPE VARCHAR(100);
            RAISE NOTICE 'wallet_tokens.wallet_address corrigé vers VARCHAR(100)';
        END IF;
        
        -- Corriger token_address
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' 
            AND column_name = 'token_address' 
            AND character_maximum_length < 100
        ) THEN
            ALTER TABLE wallet_tokens ALTER COLUMN token_address TYPE VARCHAR(100);
            RAISE NOTICE 'wallet_tokens.token_address corrigé vers VARCHAR(100)';
        END IF;
        
        -- Ajouter des colonnes manquantes si nécessaires
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' AND column_name = 'reliability_score'
        ) THEN
            ALTER TABLE wallet_tokens ADD COLUMN reliability_score DECIMAL(8,2);
            RAISE NOTICE 'Colonne reliability_score ajoutée';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' AND column_name = 'liquidity_locked_percent'
        ) THEN
            ALTER TABLE wallet_tokens ADD COLUMN liquidity_locked_percent DECIMAL(8,4);
            RAISE NOTICE 'Colonne liquidity_locked_percent ajoutée';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' AND column_name = 'security_data'
        ) THEN
            ALTER TABLE wallet_tokens ADD COLUMN security_data TEXT;
            RAISE NOTICE 'Colonne security_data ajoutée';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'wallet_tokens' AND column_name = 'geckoterminal_complete_data'
        ) THEN
            ALTER TABLE wallet_tokens ADD COLUMN geckoterminal_complete_data TEXT;
            RAISE NOTICE 'Colonne geckoterminal_complete_data ajoutée';
        END IF;
    END IF;
END $$;

-- ===============================================
-- CRÉER LES INDEX (après que toutes les tables existent)
-- ===============================================
DO $$ 
BEGIN
    -- Index de base (toujours sûrs)
    CREATE INDEX IF NOT EXISTS idx_wallet_registry_address ON wallet_registry(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_wallet_registry_status ON wallet_registry(status);
    CREATE INDEX IF NOT EXISTS idx_token_enrichment_address ON token_enrichment_data(token_address);
    CREATE INDEX IF NOT EXISTS idx_batch_logs_status ON batch_processing_logs(status);
    CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_performance_logs(endpoint);
    
    -- Index wallet_tokens (seulement si les colonnes existent)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_tokens' AND column_name = 'wallet_address'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet ON wallet_tokens(wallet_address);
        RAISE NOTICE 'Index wallet_tokens.wallet_address créé';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_tokens' AND column_name = 'token_address'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token_address);
        RAISE NOTICE 'Index wallet_tokens.token_address créé';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_tokens' AND column_name = 'total_pnl_usd'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_wallet_tokens_pnl ON wallet_tokens(total_pnl_usd DESC);
        RAISE NOTICE 'Index wallet_tokens.total_pnl_usd créé';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_tokens' AND column_name = 'roi_percentage'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_wallet_tokens_roi ON wallet_tokens(roi_percentage DESC);
        RAISE NOTICE 'Index wallet_tokens.roi_percentage créé';
    END IF;
    
    RAISE NOTICE 'Tous les index créés avec succès';
END $$;

-- ===============================================
-- CONFIRMATION
-- ===============================================
SELECT 'Tables créées avec succès! 🚀' as status,
       'Adresses Solana (46 chars) supportées' as info,
       'Prêt pour le Market Cap Analyzer' as ready;

-- Lister les tables créées
SELECT 
    COUNT(*) as tables_count,
    STRING_AGG(tablename, ', ') as tables
FROM pg_tables 
WHERE schemaname = 'public';

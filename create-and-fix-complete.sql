-- Script de création et correction complète pour scanDune
-- À exécuter dans le SQL Editor de Supabase
-- Combine création des tables + correction des contraintes d'adresses

-- ===============================================
-- ÉTAPE 1: SUPPRIMER LES VUES EXISTANTES (au cas où)
-- ===============================================
DROP VIEW IF EXISTS top_performing_wallets_extended CASCADE;
DROP VIEW IF EXISTS wallet_trading_stats CASCADE;
DROP VIEW IF EXISTS top_token_performers CASCADE;
DROP VIEW IF EXISTS wallet_performance_summary CASCADE;
DROP VIEW IF EXISTS token_analysis CASCADE;

-- ===============================================
-- ÉTAPE 2: CRÉER LES TABLES AVEC LES BONNES CONTRAINTES
-- ===============================================

-- 1. Table wallet_registry (avec adresses 100 chars dès le début)
CREATE TABLE IF NOT EXISTS wallet_registry (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(100) UNIQUE NOT NULL,  -- 100 au lieu de 44
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

-- 2. Table wallet_tokens (avec adresses 100 chars)
CREATE TABLE IF NOT EXISTS wallet_tokens (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(100) NOT NULL,  -- 100 au lieu de 44
    token_address VARCHAR(100) NOT NULL,   -- 100 au lieu de 44
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, token_address)
);

-- 3. Table token_enrichment_data (avec adresses 100 chars)
CREATE TABLE IF NOT EXISTS token_enrichment_data (
    id BIGSERIAL PRIMARY KEY,
    token_address VARCHAR(100) UNIQUE NOT NULL,  -- 100 au lieu de 44
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
    geckoterminal_complete_data TEXT,  -- TEXT au lieu de JSONB pour éviter les limites
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
    wallet_address VARCHAR(100),  -- 100 au lieu de 44
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
-- ÉTAPE 3: CORRIGER LES TABLES EXISTANTES (si elles existent déjà)
-- ===============================================

-- Corriger wallet_registry si elle existe déjà avec les mauvaises contraintes
DO $$ 
BEGIN
    -- Corriger la taille de wallet_address
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

-- Corriger wallet_tokens si elle existe déjà
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
    END IF;
END $$;

-- Corriger token_enrichment_data si elle existe déjà
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'token_enrichment_data') THEN
        -- Corriger token_address
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'token_enrichment_data' 
            AND column_name = 'token_address' 
            AND character_maximum_length < 100
        ) THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN token_address TYPE VARCHAR(100);
            RAISE NOTICE 'token_enrichment_data.token_address corrigé vers VARCHAR(100)';
        END IF;
    END IF;
END $$;

-- ===============================================
-- ÉTAPE 4: CRÉER LES INDEX POUR LES PERFORMANCES
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_wallet_registry_address ON wallet_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_registry_status ON wallet_registry(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet ON wallet_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_pnl ON wallet_tokens(total_pnl_usd DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_roi ON wallet_tokens(roi_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_token_enrichment_address ON token_enrichment_data(token_address);
CREATE INDEX IF NOT EXISTS idx_batch_logs_status ON batch_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_performance_logs(endpoint);

-- ===============================================
-- ÉTAPE 5: CRÉER LES VUES ESSENTIELLES (après que les tables existent)
-- ===============================================

-- Vérifier d'abord que la table wallet_tokens existe et a les bonnes colonnes
DO $$ 
BEGIN
    -- Créer les vues seulement si la table wallet_tokens existe avec les bonnes colonnes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallet_tokens' 
        AND column_name = 'total_pnl_usd'
    ) THEN
        -- Vue pour les performances des wallets
        EXECUTE '
        CREATE OR REPLACE VIEW wallet_performance_summary AS
        SELECT 
            wt.wallet_address,
            COUNT(*) as total_tokens,
            COALESCE(AVG(wt.total_pnl_usd), 0) as avg_pnl,
            COALESCE(SUM(wt.total_pnl_usd), 0) as total_pnl,
            COALESCE(AVG(wt.roi_percentage), 0) as avg_roi,
            COALESCE(MAX(wt.roi_percentage), 0) as max_roi,
            COUNT(CASE WHEN wt.total_pnl_usd > 0 THEN 1 END) as winning_trades,
            COUNT(CASE WHEN wt.total_pnl_usd < 0 THEN 1 END) as losing_trades,
            CASE 
                WHEN COUNT(*) > 0 
                THEN ROUND(COUNT(CASE WHEN wt.total_pnl_usd > 0 THEN 1 END)::decimal / COUNT(*)::decimal * 100, 2)
                ELSE 0 
            END as win_rate,
            MAX(wt.updated_at) as last_trade_date
        FROM wallet_tokens wt 
        WHERE wt.total_pnl_usd IS NOT NULL 
        GROUP BY wt.wallet_address';
        
        -- Vue pour les top performers
        EXECUTE '
        CREATE OR REPLACE VIEW top_token_performers AS
        SELECT 
            wt.token_address,
            wt.token_symbol,
            wt.token_name,
            COUNT(*) as holders_count,
            COALESCE(AVG(wt.roi_percentage), 0) as avg_roi,
            COALESCE(MAX(wt.roi_percentage), 0) as max_roi,
            COALESCE(SUM(wt.total_pnl_usd), 0) as total_pnl_all_holders,
            COALESCE(AVG(wt.market_cap_usd), 0) as avg_market_cap
        FROM wallet_tokens wt 
        WHERE wt.total_pnl_usd IS NOT NULL 
        GROUP BY wt.token_address, wt.token_symbol, wt.token_name
        HAVING COUNT(*) >= 2
        ORDER BY avg_roi DESC';
        
        RAISE NOTICE 'Vues créées avec succès';
    ELSE
        RAISE NOTICE 'Table wallet_tokens pas encore prête pour les vues - elles seront créées plus tard';
    END IF;
END $$;

-- ===============================================
-- CONFIRMATION
-- ===============================================
SELECT 'Base de données créée et corrigée avec succès! 🚀' as status,
       'Les adresses Solana (46 chars) peuvent maintenant être stockées' as info;

-- Compter les tables créées
SELECT 
    COUNT(*) as tables_created,
    STRING_AGG(tablename, ', ') as table_names
FROM pg_tables 
WHERE schemaname = 'public';

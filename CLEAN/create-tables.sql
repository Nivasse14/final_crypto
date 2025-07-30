-- Script pour créer les tables de base si elles n'existent pas
-- À exécuter AVANT le script de correction des types

-- 1. Créer la table wallet_registry si elle n'existe pas
CREATE TABLE IF NOT EXISTS wallet_registry (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
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

-- 2. Créer la table wallet_tokens si elle n'existe pas
CREATE TABLE IF NOT EXISTS wallet_tokens (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL,
    token_address VARCHAR(44) NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    balance DECIMAL(20,8) DEFAULT 0,
    token_price_usd DECIMAL(20,8) DEFAULT 0,
    total_usd_value DECIMAL(20,2) DEFAULT 0,
    portfolio_weight_pct DECIMAL(8,4) DEFAULT 0,
    price_change_24h DECIMAL(8,4) DEFAULT 0,
    pnl DECIMAL(20,2) DEFAULT 0,
    pnl_percentage DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, token_address)
);

-- 3. Créer la table token_enrichment_data si elle n'existe pas
CREATE TABLE IF NOT EXISTS token_enrichment_data (
    id BIGSERIAL PRIMARY KEY,
    token_address VARCHAR(44) UNIQUE NOT NULL,
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    market_cap_usd DECIMAL(20,2),
    calculated_market_cap_usd DECIMAL(20,2),
    circulating_supply DECIMAL(20,2),
    price_usd DECIMAL(20,8),
    price_change_1h DECIMAL(8,4),
    price_change_24h DECIMAL(8,4),
    price_change_7d DECIMAL(8,4),
    volume_24h_usd DECIMAL(20,2),
    volume_24h_change DECIMAL(8,4),
    liquidity_usd DECIMAL(20,2),
    fdv DECIMAL(20,2),
    top_10_holder_percent DECIMAL(8,4),
    locked_percent DECIMAL(8,4),
    buy_tax DECIMAL(8,6),
    sell_tax DECIMAL(8,6),
    security_score INTEGER,
    reliability_score INTEGER,
    on_coingecko BOOLEAN DEFAULT FALSE,
    enrichment_source VARCHAR(50),
    enrichment_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Créer la table batch_processing_logs si elle n'existe pas
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

-- 5. Créer la table api_performance_logs si elle n'existe pas
CREATE TABLE IF NOT EXISTS api_performance_logs (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    wallet_address VARCHAR(44),
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

-- 6. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_wallet_registry_address ON wallet_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_registry_status ON wallet_registry(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet ON wallet_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_token_enrichment_address ON token_enrichment_data(token_address);
CREATE INDEX IF NOT EXISTS idx_batch_logs_status ON batch_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_performance_logs(endpoint);

-- Message de confirmation
SELECT 'Tables créées avec succès! Vous pouvez maintenant exécuter fix-column-types-safe.sql' as status;

-- Script d'initialisation simple pour la table scraped_wallets

CREATE TABLE IF NOT EXISTS scraped_wallets (
  id BIGSERIAL PRIMARY KEY,
  scraping_job_id TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  dune_url TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  
  -- Liens
  solscan_url TEXT,
  gmgn_url TEXT,
  cielo_url TEXT,
  wallet_pnl_link TEXT,
  
  -- Métriques
  wallet_pnl TEXT,
  total_bought_usd TEXT,
  total_pnl_usd TEXT,
  roi TEXT,
  mroi TEXT,
  
  -- Stats trading
  invalids TEXT,
  tokens TEXT,
  nosells TEXT,
  losses TEXT,
  nulls TEXT,
  wins TEXT,
  winrate TEXT,
  w2x TEXT,
  w10x TEXT,
  w100x TEXT,
  scalps TEXT,
  scalp_ratio TEXT,
  bal TEXT,
  bal_ratio TEXT,
  last_trade TEXT,
  trade_days TEXT,
  trade_nums TEXT,
  
  -- Enrichissement
  enrichment_status TEXT DEFAULT 'pending',
  enriched_at TIMESTAMPTZ,
  enrichment_job_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_wallet ON scraped_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_job ON scraped_wallets(scraping_job_id);
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_status ON scraped_wallets(enrichment_status);

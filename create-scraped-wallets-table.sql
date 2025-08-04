-- Table pour stocker les portefeuilles scrapés depuis Dune
CREATE TABLE IF NOT EXISTS scraped_wallets (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identifiants du scraping
  scraping_job_id TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  dune_url TEXT NOT NULL,
  
  -- Données du portefeuille
  wallet_address TEXT NOT NULL,
  
  -- Liens externes
  solscan_url TEXT,
  gmgn_url TEXT,
  cielo_url TEXT,
  wallet_pnl_link TEXT,
  
  -- Métriques financières
  wallet_pnl TEXT,
  total_bought_usd TEXT,
  total_pnl_usd TEXT,
  roi TEXT,
  mroi TEXT,
  
  -- Statistiques de trading
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
  
  -- Métriques avancées
  scalps TEXT,
  scalp_ratio TEXT,
  bal TEXT,
  bal_ratio TEXT,
  last_trade TEXT,
  trade_days TEXT,
  trade_nums TEXT,
  
  -- Statut d'enrichissement
  enrichment_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  enriched_at TIMESTAMPTZ,
  enrichment_job_id TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_wallet_address ON scraped_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_scraping_job_id ON scraped_wallets(scraping_job_id);
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_scraped_at ON scraped_wallets(scraped_at);
CREATE INDEX IF NOT EXISTS idx_scraped_wallets_enrichment_status ON scraped_wallets(enrichment_status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_scraped_wallets_updated_at ON scraped_wallets;
CREATE TRIGGER update_scraped_wallets_updated_at
    BEFORE UPDATE ON scraped_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vue pour les statistiques de scraping
CREATE OR REPLACE VIEW scraping_stats AS
SELECT 
  scraping_job_id,
  dune_url,
  COUNT(*) as total_wallets,
  MIN(scraped_at) as scraping_started,
  MAX(scraped_at) as scraping_completed,
  COUNT(CASE WHEN enrichment_status = 'completed' THEN 1 END) as enriched_wallets,
  COUNT(CASE WHEN enrichment_status = 'pending' THEN 1 END) as pending_enrichment
FROM scraped_wallets 
GROUP BY scraping_job_id, dune_url
ORDER BY scraping_started DESC;

-- RLS (Row Level Security) - Optionnel
-- ALTER TABLE scraped_wallets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE scraped_wallets IS 'Stockage des portefeuilles scrapés depuis Dune Analytics avec statut d''enrichissement';
COMMENT ON COLUMN scraped_wallets.enrichment_status IS 'Statut de l''enrichissement: pending, processing, completed, failed';
COMMENT ON COLUMN scraped_wallets.scraping_job_id IS 'ID du job de scraping qui a généré cette entrée';

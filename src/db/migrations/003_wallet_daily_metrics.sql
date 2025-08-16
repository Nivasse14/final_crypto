-- Migration 003: Table métriques journalières agrégées
-- Description: Aggrégats quotidiens par wallet pour calculs de fenêtres

CREATE TABLE IF NOT EXISTS public.wallet_daily_metrics (
  wallet_address varchar(100) NOT NULL,
  day date NOT NULL,
  
  -- Métriques de base
  trades int NOT NULL DEFAULT 0,
  pnl_usd numeric(20,2) DEFAULT 0,
  roi_pct numeric(10,4) DEFAULT 0,
  
  -- Win/loss
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  
  -- Temps de détention
  avg_hold_min numeric(10,2) NULL,
  median_hold_min int NULL,
  
  -- P&L décomposé
  gross_profit_usd numeric(20,2) DEFAULT 0,
  gross_loss_abs_usd numeric(20,2) DEFAULT 0, -- valeur absolue
  
  -- Métriques calculées
  profit_factor numeric(10,4) NULL,
  expectancy_usd numeric(14,4) NULL,
  
  -- Drawdown
  drawdown_usd numeric(20,2) DEFAULT 0,
  
  -- Liquidité médiane des pools tradés
  liquidity_median_usd numeric(20,2) NULL,
  
  -- Répartition par cap (JSON)
  cap_bucket_breakdown jsonb NULL, -- {nano:%, micro:%, low:%, mid:%, large:%, mega:%}
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  PRIMARY KEY(wallet_address, day)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_wdm_wallet_day ON public.wallet_daily_metrics(wallet_address, day);
CREATE INDEX IF NOT EXISTS idx_wdm_day ON public.wallet_daily_metrics(day);
CREATE INDEX IF NOT EXISTS idx_wdm_wallet_recent ON public.wallet_daily_metrics(wallet_address, day DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_daily_metrics_updated_at 
    BEFORE UPDATE ON public.wallet_daily_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE public.wallet_daily_metrics IS 'Métriques quotidiennes agrégées par wallet';
COMMENT ON COLUMN public.wallet_daily_metrics.profit_factor IS 'Facteur de profit quotidien: gross_profit / gross_loss_abs';
COMMENT ON COLUMN public.wallet_daily_metrics.expectancy_usd IS 'Espérance de gain quotidienne en USD';
COMMENT ON COLUMN public.wallet_daily_metrics.cap_bucket_breakdown IS 'Répartition % par bucket de market cap';

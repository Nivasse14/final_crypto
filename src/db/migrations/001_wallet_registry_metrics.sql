-- Migration 001: Étendre wallet_registry avec métriques par fenêtre
-- Description: Ajouter toutes les colonnes de métriques 30j, 90j et copy trading score

-- Métriques 30 jours
ALTER TABLE public.wallet_registry 
ADD COLUMN IF NOT EXISTS profit_factor_30d numeric(8,4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS expectancy_usd_30d numeric(14,4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS drawdown_max_usd_30d numeric(14,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS median_hold_min_30d int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS scalp_ratio_30d numeric(6,2) DEFAULT NULL,

-- Exposition par cap (pourcentages)
ADD COLUMN IF NOT EXISTS cap_exposure_nano_pct_30d numeric(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cap_exposure_micro_pct_30d numeric(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cap_exposure_low_pct_30d numeric(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cap_exposure_mid_pct_30d numeric(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cap_exposure_large_pct_30d numeric(6,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cap_exposure_mega_pct_30d numeric(6,2) DEFAULT NULL,

-- Autres métriques 30j
ADD COLUMN IF NOT EXISTS liquidity_median_usd_30d numeric(14,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recency_score_30d numeric(8,4) DEFAULT NULL,

-- Streaks 90j
ADD COLUMN IF NOT EXISTS streak_wins_max_90d int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS streak_losses_max_90d int DEFAULT NULL,

-- Score final
ADD COLUMN IF NOT EXISTS copy_trading_score numeric(6,2) DEFAULT NULL,

-- Métriques déjà existantes à conserver
ADD COLUMN IF NOT EXISTS pnl_30d numeric(20,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS roi_pct_30d numeric(10,4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS winrate_30d numeric(6,4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trades_30d int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gross_profit_30d numeric(20,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gross_loss_abs_30d numeric(20,2) DEFAULT NULL;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_wallet_registry_copy_score ON public.wallet_registry(copy_trading_score DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_registry_winrate_30d ON public.wallet_registry(winrate_30d);
CREATE INDEX IF NOT EXISTS idx_wallet_registry_profit_factor_30d ON public.wallet_registry(profit_factor_30d);

-- Commentaires
COMMENT ON COLUMN public.wallet_registry.profit_factor_30d IS 'Profit Factor 30j: gross_profit_30d / gross_loss_abs_30d';
COMMENT ON COLUMN public.wallet_registry.expectancy_usd_30d IS 'Expectancy 30j: (winrate*avg_win) - ((1-winrate)*avg_loss_abs)';
COMMENT ON COLUMN public.wallet_registry.copy_trading_score IS 'Score composite 0-100 pour copy trading';

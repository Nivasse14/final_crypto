-- Migration 002: Table positions courantes par wallet & token
-- Description: Suivi des positions actuelles et PnL non réalisés

CREATE TABLE IF NOT EXISTS public.wallet_token_positions (
  wallet_address varchar(100) NOT NULL,
  token_address varchar(100) NOT NULL,
  token_symbol varchar(40) NULL,
  token_name varchar(120) NULL,
  
  -- Position nette (unités selon decimals du token)
  net_position numeric(38, 0) NOT NULL DEFAULT 0,
  
  -- Coût moyen par unité (USD)
  avg_cost_per_unit numeric(28, 12) NULL,
  
  -- Prix actuel (mis à jour via DexScreener/Jupiter)
  price_now_usd numeric(20, 8) NULL,
  
  -- Montant détenu (alias de net_position pour compatibilité)
  holding_amount numeric(38, 0) NOT NULL DEFAULT 0,
  holding_amount_usd numeric(20, 2) NULL,
  
  -- PnL non réalisé
  unrealized_pnl_usd numeric(20, 2) NULL,
  unrealized_roi_pct numeric(10, 4) NULL,
  
  -- Métadonnées
  last_price_source varchar(20) NULL, -- 'dexscreener'|'jupiter'|'none'
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY(wallet_address, token_address)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_wtp_wallet ON public.wallet_token_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wtp_value ON public.wallet_token_positions(holding_amount_usd);
CREATE INDEX IF NOT EXISTS idx_wtp_updated ON public.wallet_token_positions(last_updated_at);
CREATE INDEX IF NOT EXISTS idx_wtp_token ON public.wallet_token_positions(token_address);

-- Commentaires
COMMENT ON TABLE public.wallet_token_positions IS 'Positions actuelles par wallet et token avec PnL non réalisés';
COMMENT ON COLUMN public.wallet_token_positions.net_position IS 'Position nette: total_buy_amount - total_sell_amount';
COMMENT ON COLUMN public.wallet_token_positions.avg_cost_per_unit IS 'Coût moyen: total_buy_usd / total_buy_amount';
COMMENT ON COLUMN public.wallet_token_positions.unrealized_pnl_usd IS 'PnL non réalisé: holding_amount * (price_now - avg_cost)';
COMMENT ON COLUMN public.wallet_token_positions.unrealized_roi_pct IS 'ROI non réalisé: (price_now / avg_cost - 1) * 100';

-- Migration pour créer la table wallet_tokens_extended si elle n'existe pas

-- Créer la table wallet_tokens_extended
CREATE TABLE IF NOT EXISTS public.wallet_tokens_extended (
  id bigserial not null,
  wallet_address character varying(100) null,
  token_address character varying(100) not null,
  token_symbol character varying(50) null,
  token_name character varying(200) null,
  token_decimals integer null,
  chain character varying(20) null default 'solana'::character varying,
  balance numeric(30, 8) null,
  balance_raw numeric null,
  value_usd numeric(20, 2) null,
  total_usd_value numeric(20, 2) null,
  percentage_of_portfolio numeric(5, 2) null,
  pnl numeric(20, 8) null,
  pnl_percentage numeric(8, 4) null,
  buy_price_avg numeric(20, 10) null,
  current_price_usd numeric(20, 10) null,
  price_change_24h_pct numeric(8, 4) null,
  gt_price_usd numeric(20, 10) null,
  gt_price_change_1h numeric(8, 4) null,
  gt_price_change_24h numeric(8, 4) null,
  gt_price_change_7d numeric(8, 4) null,
  gt_volume_24h_usd numeric(20, 2) null,
  gt_volume_change_24h numeric(8, 4) null,
  gt_trades_24h integer null,
  gt_buyers_24h integer null,
  gt_sellers_24h integer null,
  market_cap_usd numeric(20, 2) null,
  calculated_market_cap_usd numeric(20, 2) null,
  original_market_cap_usd numeric(20, 2) null,
  market_cap_rank integer null,
  circulating_supply numeric null,
  total_supply numeric null,
  max_supply numeric null,
  gt_liquidity_usd numeric(20, 2) null,
  gt_liquidity_change_24h numeric(8, 4) null,
  gt_market_cap_to_liquidity_ratio numeric(10, 4) null,
  gt_score integer null,
  gt_security_score integer null,
  gt_reliability_score integer null,
  holder_count integer null,
  gp_is_honeypot boolean null,
  gp_is_mintable boolean null,
  gp_is_proxy boolean null,
  gp_is_blacklisted boolean null,
  gp_owner_balance numeric(20, 2) null,
  gp_creator_balance numeric(20, 2) null,
  gp_top_10_holder_percentage numeric(5, 2) null,
  ss_mintable character varying(10) null,
  ss_freezeable character varying(10) null,
  ss_renounced boolean null,
  ss_top_holder_percentage numeric(5, 2) null,
  is_stablecoin boolean null default false,
  is_defi_token boolean null default false,
  is_meme_token boolean null default false,
  is_nft_related boolean null default false,
  risk_level character varying(20) null,
  geckoterminal_enriched boolean null default false,
  goplus_enriched boolean null default false,
  soul_scanner_enriched boolean null default false,
  last_enriched timestamp with time zone null,
  enrichment_version integer null default 1,
  geckoterminal_raw_data text null,
  goplus_raw_data jsonb null,
  soul_scanner_raw_data jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  token_total_pnl numeric null,
  token_trade_count integer null,
  token_winning_trades integer null,
  token_losing_trades integer null,
  token_win_rate numeric null,
  token_avg_pnl_per_trade numeric null,
  token_largest_win numeric null,
  token_largest_loss numeric null,
  raw_pnl_history text null,
  data_source text null default 'complete'::text,
  enrichment_status text null,
  reliability_score numeric null,
  has_market_cap boolean null default false,
  has_security_data boolean null default false,
  gt_token_address text null,
  gt_token_name text null,
  gt_token_symbol text null,
  gt_market_cap_usd numeric null,
  gt_calculated_market_cap_usd numeric null,
  gt_original_market_cap_usd numeric null,
  gt_circulating_supply numeric null,
  gt_total_supply numeric null,
  gt_max_supply numeric null,
  gt_pool_liquidity_usd numeric null,
  gt_pool_score numeric null,
  gt_pool_price_usd numeric null,
  gt_pool_volume_24h_usd numeric null,
  gt_pool_fdv numeric null,
  gt_pool_price_change_percentage_24h numeric null,
  gt_security_holder_count integer null,
  gt_security_mintable boolean null,
  gt_security_freezeable boolean null,
  gt_security_top_10_holder_percent numeric null,
  gt_security_top_10_user_balance numeric null,
  gt_security_locked_percent numeric null,
  gt_goplus_honeypot_risk text null,
  gt_goplus_transfer_pausable text null,
  gt_goplus_is_blacklisted text null,
  gt_goplus_is_whitelisted text null,
  gt_goplus_buy_tax numeric null,
  gt_goplus_sell_tax numeric null,
  raw_geckoterminal_data jsonb null,
  raw_security_data jsonb null,
  raw_market_data jsonb null,
  gt_address character varying(100) null,
  current_balance numeric null,
  current_value_usd numeric null,
  pnl_usd numeric null,
  avg_buy_price numeric null,
  avg_sell_price numeric null,
  first_buy_timestamp bigint null,
  last_sell_timestamp bigint null,
  buy_count integer null,
  sell_count integer null,
  total_buy_amount numeric null,
  total_sell_amount numeric null,
  token_price_usd numeric null,
  raw_portfolio_data jsonb null,
  raw_complete_token_data jsonb null,
  portfolio_weight_pct numeric null,
  holding_rank integer null,
  is_top_holding boolean null,
  unrealized_pnl numeric null,
  realized_pnl numeric null,
  supply_owned numeric null,
  gt_enriched boolean null default false,
  gt_name text null,
  gt_symbol text null,
  gt_decimals integer null,
  gt_on_coingecko boolean null default false,
  gt_reliability_total_score numeric null,
  gt_reliability_pool_score numeric null,
  gt_reliability_security_score numeric null,
  gt_reliability_fundamentals_score numeric null,
  gt_reliability_community_score numeric null,
  raw_token_data text null,
  last_updated_api timestamp with time zone null,
  gt_decimals_decimal numeric null,
  token_decimals_decimal numeric null,
  CONSTRAINT wallet_tokens_extended_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_tokens_extended_wallet_address_token_address_key UNIQUE (wallet_address, token_address)
);

-- Ajouter la contrainte de clé étrangère si la table wallets_extended existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets_extended') THEN
        ALTER TABLE public.wallet_tokens_extended 
        ADD CONSTRAINT IF NOT EXISTS wallet_tokens_extended_wallet_address_fkey 
        FOREIGN KEY (wallet_address) REFERENCES wallets_extended (wallet_address) ON DELETE CASCADE;
    END IF;
END $$;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_tokens_ext_value ON public.wallet_tokens_extended USING btree (value_usd DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_marketcap ON public.wallet_tokens_extended USING btree (market_cap_usd DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_pnl ON public.wallet_tokens_extended USING btree (pnl DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_risk ON public.wallet_tokens_extended USING btree (risk_level);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_enriched ON public.wallet_tokens_extended USING btree (geckoterminal_enriched, last_enriched);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_wallet ON public.wallet_tokens_extended USING btree (wallet_address);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_wallet_value ON public.wallet_tokens_extended USING btree (wallet_address, value_usd DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_symbol ON public.wallet_tokens_extended USING btree (token_symbol);
CREATE INDEX IF NOT EXISTS idx_tokens_ext_symbol_marketcap ON public.wallet_tokens_extended USING btree (token_symbol, market_cap_usd DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_wallet_address ON public.wallet_tokens_extended USING btree (wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_token_address ON public.wallet_tokens_extended USING btree (token_address);

-- Créer les triggers si les fonctions existent
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_modified_column') THEN
        DROP TRIGGER IF EXISTS update_wallet_tokens_extended_modtime ON wallet_tokens_extended;
        CREATE TRIGGER update_wallet_tokens_extended_modtime 
        BEFORE UPDATE ON wallet_tokens_extended 
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_wallet_tokens_extended_updated_at ON wallet_tokens_extended;
        CREATE TRIGGER update_wallet_tokens_extended_updated_at 
        BEFORE UPDATE ON wallet_tokens_extended 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

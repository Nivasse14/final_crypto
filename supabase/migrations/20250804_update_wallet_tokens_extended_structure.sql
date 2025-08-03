-- Migration pour mettre à jour la structure de wallet_tokens_extended
-- Ajout des colonnes spécifiques demandées

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Colonnes de base token
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'token_id') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN token_id text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'token_network') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN token_network text NULL DEFAULT 'solana';
    END IF;
    
    -- Colonnes de pool/market data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_id') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_id text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_address') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_address text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_base_token_price_usd') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_base_token_price_usd numeric(20, 10) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_base_token_price_native_currency') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_base_token_price_native_currency numeric(20, 10) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_quote_token_price_usd') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_quote_token_price_usd numeric(20, 10) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_quote_token_price_native_currency') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_quote_token_price_native_currency numeric(20, 10) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_base_token_price_quote_token') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_base_token_price_quote_token numeric(20, 10) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_quote_token_price_base_token') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_quote_token_price_base_token numeric(20, 10) NULL;
    END IF;
    
    -- Colonnes de price change
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_price_change_percentage_5m') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_price_change_percentage_5m numeric(8, 4) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_price_change_percentage_1h') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_price_change_percentage_1h numeric(8, 4) NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'pool_price_change_percentage_6h') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN pool_price_change_percentage_6h numeric(8, 4) NULL;
    END IF;
    
    -- Colonnes de security (GoPlus format spécifique)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_is_open_source') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_is_open_source text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_is_proxy') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_is_proxy text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_is_mintable') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_is_mintable text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_can_take_back_ownership') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_can_take_back_ownership text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_owner_change_balance') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_owner_change_balance text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_hidden_owner') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_hidden_owner text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_selfdestruct') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_selfdestruct text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_external_call') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_external_call text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_gas_abuse') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_gas_abuse text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_buy_tax') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_buy_tax text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_sell_tax') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_sell_tax text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_is_blacklisted') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_is_blacklisted text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_is_whitelisted') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_is_whitelisted text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_is_in_dex') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_is_in_dex text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_trust_list') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_trust_list text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_other_potential_risks') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_other_potential_risks text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_note') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_note text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_honeypot_with_same_creator') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_honeypot_with_same_creator text NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'security_fake_token') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN security_fake_token text NULL;
    END IF;
    
    -- Colonnes de holders data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'holders_holder_count') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN holders_holder_count integer NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'holders_total_supply') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN holders_total_supply numeric NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'holders_lp_holder_count') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN holders_lp_holder_count integer NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'holders_lp_total_supply') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN holders_lp_total_supply numeric NULL;
    END IF;
    
    -- Colonnes de métadonnées enrichissement
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'enrichment_source') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN enrichment_source text NULL DEFAULT 'geckoterminal';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'enrichment_timestamp') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN enrichment_timestamp timestamp with time zone NULL DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'enrichment_success') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN enrichment_success boolean NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'enrichment_error') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN enrichment_error text NULL;
    END IF;
    
    -- Colonnes pour les données brutes complètes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'raw_pool_data') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN raw_pool_data jsonb NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'raw_price_data') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN raw_price_data jsonb NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'raw_holders_data') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN raw_holders_data jsonb NULL;
    END IF;
    
    -- Colonnes de statut et version
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'data_version') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN data_version integer NULL DEFAULT 2;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_tokens_extended' AND column_name = 'last_sync') THEN
        ALTER TABLE public.wallet_tokens_extended ADD COLUMN last_sync timestamp with time zone NULL DEFAULT now();
    END IF;
    
    -- Mettre à jour la version des données existantes
    UPDATE public.wallet_tokens_extended 
    SET data_version = 2, last_sync = now() 
    WHERE data_version IS NULL OR data_version < 2;
    
END $$;

-- Créer des index additionnels pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_token_id ON public.wallet_tokens_extended USING btree (token_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_pool_id ON public.wallet_tokens_extended USING btree (pool_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_enrichment_success ON public.wallet_tokens_extended USING btree (enrichment_success, enrichment_timestamp);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_data_version ON public.wallet_tokens_extended USING btree (data_version, last_sync);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_extended_network ON public.wallet_tokens_extended USING btree (token_network);

-- Mise à jour des commentaires de la table
COMMENT ON TABLE public.wallet_tokens_extended IS 'Table étendue pour stocker les tokens de wallet enrichis avec les données Geckoterminal, GoPlus et autres sources';
COMMENT ON COLUMN public.wallet_tokens_extended.token_id IS 'ID unique du token selon Geckoterminal';
COMMENT ON COLUMN public.wallet_tokens_extended.token_network IS 'Réseau blockchain du token (solana, ethereum, etc.)';
COMMENT ON COLUMN public.wallet_tokens_extended.pool_id IS 'ID du pool de liquidité principal';
COMMENT ON COLUMN public.wallet_tokens_extended.enrichment_source IS 'Source des données d''enrichissement (geckoterminal, goplus, etc.)';
COMMENT ON COLUMN public.wallet_tokens_extended.enrichment_success IS 'Indique si l''enrichissement a réussi';
COMMENT ON COLUMN public.wallet_tokens_extended.data_version IS 'Version du schéma de données pour la migration';

-- Vérification finale
SELECT 
    'Migration completed successfully. Table wallet_tokens_extended now has ' || 
    COUNT(*) || ' columns.' as migration_status
FROM information_schema.columns 
WHERE table_name = 'wallet_tokens_extended' 
AND table_schema = 'public';

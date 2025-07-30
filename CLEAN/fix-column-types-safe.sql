-- Script de correction sécurisé des types de colonnes
-- Vérifie l'existence des colonnes avant de les modifier

-- Fonction helper pour vérifier si une colonne existe
CREATE OR REPLACE FUNCTION column_exists(table_name_param text, column_name_param text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = table_name_param 
          AND column_name = column_name_param
    );
END;
$$ LANGUAGE plpgsql;

-- Correction pour wallet_registry
DO $$ 
BEGIN
    -- Corriger total_pnl_usd si elle existe
    IF column_exists('wallet_registry', 'total_pnl_usd') THEN
        ALTER TABLE wallet_registry ALTER COLUMN total_pnl_usd TYPE DECIMAL(20,2);
        RAISE NOTICE 'wallet_registry.total_pnl_usd corrigé';
    END IF;
    
    -- Corriger total_bought_usd si elle existe
    IF column_exists('wallet_registry', 'total_bought_usd') THEN
        ALTER TABLE wallet_registry ALTER COLUMN total_bought_usd TYPE DECIMAL(20,2);
        RAISE NOTICE 'wallet_registry.total_bought_usd corrigé';
    END IF;
    
    -- Corriger roi si elle existe
    IF column_exists('wallet_registry', 'roi') THEN
        ALTER TABLE wallet_registry ALTER COLUMN roi TYPE DECIMAL(8,4);
        RAISE NOTICE 'wallet_registry.roi corrigé';
    END IF;
    
    -- Corriger winrate si elle existe
    IF column_exists('wallet_registry', 'winrate') THEN
        ALTER TABLE wallet_registry ALTER COLUMN winrate TYPE DECIMAL(8,4);
        RAISE NOTICE 'wallet_registry.winrate corrigé';
    END IF;
END $$;

-- Correction pour wallet_tokens (si la table existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_tokens') THEN
        -- Corriger balance si elle existe
        IF column_exists('wallet_tokens', 'balance') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN balance TYPE DECIMAL(20,8);
            RAISE NOTICE 'wallet_tokens.balance corrigé';
        END IF;
        
        -- Corriger token_price_usd si elle existe
        IF column_exists('wallet_tokens', 'token_price_usd') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN token_price_usd TYPE DECIMAL(20,8);
            RAISE NOTICE 'wallet_tokens.token_price_usd corrigé';
        END IF;
        
        -- Corriger total_usd_value si elle existe
        IF column_exists('wallet_tokens', 'total_usd_value') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN total_usd_value TYPE DECIMAL(20,2);
            RAISE NOTICE 'wallet_tokens.total_usd_value corrigé';
        END IF;
        
        -- Corriger portfolio_weight_pct si elle existe
        IF column_exists('wallet_tokens', 'portfolio_weight_pct') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN portfolio_weight_pct TYPE DECIMAL(8,4);
            RAISE NOTICE 'wallet_tokens.portfolio_weight_pct corrigé';
        END IF;
        
        -- Corriger price_change_24h si elle existe
        IF column_exists('wallet_tokens', 'price_change_24h') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN price_change_24h TYPE DECIMAL(8,4);
            RAISE NOTICE 'wallet_tokens.price_change_24h corrigé';
        END IF;
        
        -- Corriger pnl si elle existe
        IF column_exists('wallet_tokens', 'pnl') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN pnl TYPE DECIMAL(20,2);
            RAISE NOTICE 'wallet_tokens.pnl corrigé';
        END IF;
        
        -- Corriger pnl_percentage si elle existe
        IF column_exists('wallet_tokens', 'pnl_percentage') THEN
            ALTER TABLE wallet_tokens ALTER COLUMN pnl_percentage TYPE DECIMAL(8,4);
            RAISE NOTICE 'wallet_tokens.pnl_percentage corrigé';
        END IF;
    ELSE
        RAISE NOTICE 'Table wallet_tokens n''existe pas';
    END IF;
END $$;

-- Correction pour token_enrichment_data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'token_enrichment_data') THEN
        -- Corriger market_cap_usd si elle existe
        IF column_exists('token_enrichment_data', 'market_cap_usd') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN market_cap_usd TYPE DECIMAL(20,2);
            RAISE NOTICE 'token_enrichment_data.market_cap_usd corrigé';
        END IF;
        
        -- Corriger calculated_market_cap_usd si elle existe
        IF column_exists('token_enrichment_data', 'calculated_market_cap_usd') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN calculated_market_cap_usd TYPE DECIMAL(20,2);
            RAISE NOTICE 'token_enrichment_data.calculated_market_cap_usd corrigé';
        END IF;
        
        -- Corriger circulating_supply si elle existe
        IF column_exists('token_enrichment_data', 'circulating_supply') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN circulating_supply TYPE DECIMAL(20,2);
            RAISE NOTICE 'token_enrichment_data.circulating_supply corrigé';
        END IF;
        
        -- Corriger price_usd si elle existe
        IF column_exists('token_enrichment_data', 'price_usd') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN price_usd TYPE DECIMAL(20,8);
            RAISE NOTICE 'token_enrichment_data.price_usd corrigé';
        END IF;
        
        -- Autres colonnes price_change
        IF column_exists('token_enrichment_data', 'price_change_1h') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN price_change_1h TYPE DECIMAL(8,4);
            RAISE NOTICE 'token_enrichment_data.price_change_1h corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'price_change_24h') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN price_change_24h TYPE DECIMAL(8,4);
            RAISE NOTICE 'token_enrichment_data.price_change_24h corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'price_change_7d') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN price_change_7d TYPE DECIMAL(8,4);
            RAISE NOTICE 'token_enrichment_data.price_change_7d corrigé';
        END IF;
        
        -- Volume et liquidité
        IF column_exists('token_enrichment_data', 'volume_24h_usd') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN volume_24h_usd TYPE DECIMAL(20,2);
            RAISE NOTICE 'token_enrichment_data.volume_24h_usd corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'volume_24h_change') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN volume_24h_change TYPE DECIMAL(8,4);
            RAISE NOTICE 'token_enrichment_data.volume_24h_change corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'liquidity_usd') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN liquidity_usd TYPE DECIMAL(20,2);
            RAISE NOTICE 'token_enrichment_data.liquidity_usd corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'fdv') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN fdv TYPE DECIMAL(20,2);
            RAISE NOTICE 'token_enrichment_data.fdv corrigé';
        END IF;
        
        -- Pourcentages
        IF column_exists('token_enrichment_data', 'top_10_holder_percent') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN top_10_holder_percent TYPE DECIMAL(8,4);
            RAISE NOTICE 'token_enrichment_data.top_10_holder_percent corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'locked_percent') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN locked_percent TYPE DECIMAL(8,4);
            RAISE NOTICE 'token_enrichment_data.locked_percent corrigé';
        END IF;
        
        -- Taxes
        IF column_exists('token_enrichment_data', 'buy_tax') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN buy_tax TYPE DECIMAL(8,6);
            RAISE NOTICE 'token_enrichment_data.buy_tax corrigé';
        END IF;
        
        IF column_exists('token_enrichment_data', 'sell_tax') THEN
            ALTER TABLE token_enrichment_data ALTER COLUMN sell_tax TYPE DECIMAL(8,6);
            RAISE NOTICE 'token_enrichment_data.sell_tax corrigé';
        END IF;
    ELSE
        RAISE NOTICE 'Table token_enrichment_data n''existe pas';
    END IF;
END $$;

-- Nettoyer la fonction helper
DROP FUNCTION column_exists(text, text);

-- Message final
SELECT 'Script de correction exécuté - Vérifiez les messages NOTICE ci-dessus' as status;

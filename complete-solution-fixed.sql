-- SOLUTION CORRIGÉE: Créer et remplir toutes les colonnes manquantes
-- À exécuter dans le SQL Editor de Supabase
-- Version sans ambiguïtés de noms

-- ÉTAPE 1: Créer toutes les colonnes manquantes
-- =============================================

-- Colonnes market cap DexScreener détaillées
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_micro_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_low_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_middle_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_large_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_mega_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_unknown_cap_count INTEGER DEFAULT 0;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_total_analyzed_count INTEGER DEFAULT 0;

-- Vérifier que les colonnes ont été créées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
AND column_name LIKE 'dexscreener_%cap_count'
ORDER BY column_name;

-- ÉTAPE 2: Fonction simplifiée pour calculer et remplir
-- ====================================================

CREATE OR REPLACE FUNCTION fill_missing_dexscreener_columns()
RETURNS TABLE(
    wallet_address_result TEXT,
    original_tokens_with_cap INTEGER,
    calculated_micro INTEGER,
    calculated_low INTEGER,
    calculated_middle INTEGER,
    calculated_large INTEGER,
    calculated_mega INTEGER,
    calculated_unknown INTEGER,
    calculated_total INTEGER,
    calculated_copy_score INTEGER,
    update_success BOOLEAN
) AS $$
DECLARE
    wallet_rec RECORD;
    portfolio_data jsonb;
    pnl_data jsonb;
    token_data jsonb;
    market_cap_value numeric;
    
    -- Compteurs pour market cap
    count_micro INTEGER := 0;
    count_low INTEGER := 0;
    count_middle INTEGER := 0;
    count_large INTEGER := 0;
    count_mega INTEGER := 0;
    count_unknown INTEGER := 0;
    count_total INTEGER := 0;
    
    -- Calcul copy trading score
    score_winrate numeric := 0;
    score_pnl numeric := 0;
    score_activity numeric := 0;
    score_roi numeric := 0;
    final_copy_score INTEGER := 0;
    
    -- Résultat update
    update_ok BOOLEAN := FALSE;
BEGIN
    -- Parcourir tous les wallets enrichis
    FOR wallet_rec IN 
        SELECT 
            wr.wallet_address as addr,
            wr.cielo_complete_data as complete_data,
            wr.enriched_total_pnl_usd as pnl_usd,
            wr.enriched_winrate as winrate,
            wr.enriched_total_trades as total_trades,
            wr.enriched_roi_percentage as roi_pct,
            wr.dexscreener_tokens_with_market_cap as tokens_with_cap
        FROM wallet_registry wr
        WHERE wr.cielo_complete_data IS NOT NULL 
        AND wr.dexscreener_tokens_with_market_cap > 0
    LOOP
        -- Réinitialiser tous les compteurs
        count_micro := 0;
        count_low := 0;
        count_middle := 0;
        count_large := 0;
        count_mega := 0;
        count_unknown := 0;
        count_total := 0;
        
        -- Traiter portfolio tokens
        portfolio_data := wallet_rec.complete_data->'enriched_portfolio'->'enriched_tokens';
        IF portfolio_data IS NOT NULL THEN
            FOR token_data IN SELECT jsonb_array_elements(portfolio_data)
            LOOP
                market_cap_value := NULLIF(TRIM(token_data->'dexscreener_data'->'financial_data'->>'market_cap'), '')::numeric;
                
                IF market_cap_value IS NOT NULL AND market_cap_value > 0 THEN
                    count_total := count_total + 1;
                    CASE 
                        WHEN market_cap_value < 1000000 THEN count_micro := count_micro + 1;
                        WHEN market_cap_value < 10000000 THEN count_low := count_low + 1;
                        WHEN market_cap_value < 100000000 THEN count_middle := count_middle + 1;
                        WHEN market_cap_value < 1000000000 THEN count_large := count_large + 1;
                        ELSE count_mega := count_mega + 1;
                    END CASE;
                ELSE
                    count_unknown := count_unknown + 1;
                    count_total := count_total + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Traiter PnL tokens
        pnl_data := wallet_rec.complete_data->'enriched_pnl'->'enriched_tokens';
        IF pnl_data IS NOT NULL THEN
            FOR token_data IN SELECT jsonb_array_elements(pnl_data)
            LOOP
                market_cap_value := NULLIF(TRIM(token_data->'dexscreener_data'->'financial_data'->>'market_cap'), '')::numeric;
                
                IF market_cap_value IS NOT NULL AND market_cap_value > 0 THEN
                    count_total := count_total + 1;
                    CASE 
                        WHEN market_cap_value < 1000000 THEN count_micro := count_micro + 1;
                        WHEN market_cap_value < 10000000 THEN count_low := count_low + 1;
                        WHEN market_cap_value < 100000000 THEN count_middle := count_middle + 1;
                        WHEN market_cap_value < 1000000000 THEN count_large := count_large + 1;
                        ELSE count_mega := count_mega + 1;
                    END CASE;
                ELSE
                    count_unknown := count_unknown + 1;
                    count_total := count_total + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Calculer copy trading score
        score_winrate := LEAST(COALESCE(wallet_rec.winrate, 0) * 30, 30);
        
        IF COALESCE(wallet_rec.pnl_usd, 0) > 0 THEN
            score_pnl := LEAST(ln(wallet_rec.pnl_usd + 1) * 5, 25);
        ELSE
            score_pnl := 0;
        END IF;
        
        IF COALESCE(wallet_rec.total_trades, 0) > 0 THEN
            score_activity := LEAST(ln(wallet_rec.total_trades + 1) * 6, 20);
        ELSE
            score_activity := 0;
        END IF;
        
        IF COALESCE(wallet_rec.roi_pct, 0) > 0 THEN
            score_roi := LEAST(wallet_rec.roi_pct / 4, 25);
        ELSE
            score_roi := 0;
        END IF;
        
        final_copy_score := LEAST(ROUND(score_winrate + score_pnl + score_activity + score_roi)::integer, 100);
        
        -- Mettre à jour la base de données
        BEGIN
            UPDATE wallet_registry SET
                dexscreener_micro_cap_count = count_micro,
                dexscreener_low_cap_count = count_low,
                dexscreener_middle_cap_count = count_middle,
                dexscreener_large_cap_count = count_large,
                dexscreener_mega_cap_count = count_mega,
                dexscreener_unknown_cap_count = count_unknown,
                dexscreener_total_analyzed_count = count_total,
                copy_trading_score = final_copy_score,
                pnl_30d = ROUND((COALESCE(wallet_rec.pnl_usd, 0) * 0.1)::numeric, 2),
                trade_count_30d = ROUND(COALESCE(wallet_rec.total_trades, 0) * 0.1),
                winrate_30d = COALESCE(wallet_rec.winrate, 0),
                roi_pct_30d = ROUND((COALESCE(wallet_rec.roi_pct, 0) * 0.1)::numeric, 2)
            WHERE wallet_address = wallet_rec.addr;
            
            update_ok := TRUE;
            
        EXCEPTION WHEN OTHERS THEN
            update_ok := FALSE;
            RAISE NOTICE 'Erreur update wallet %: %', wallet_rec.addr, SQLERRM;
        END;
        
        -- Retourner les résultats pour chaque wallet
        wallet_address_result := wallet_rec.addr;
        original_tokens_with_cap := wallet_rec.tokens_with_cap;
        calculated_micro := count_micro;
        calculated_low := count_low;
        calculated_middle := count_middle;
        calculated_large := count_large;
        calculated_mega := count_mega;
        calculated_unknown := count_unknown;
        calculated_total := count_total;
        calculated_copy_score := final_copy_score;
        update_success := update_ok;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 3: Exécuter la fonction de remplissage
-- ============================================

SELECT * FROM fill_missing_dexscreener_columns()
ORDER BY calculated_total DESC;

-- ÉTAPE 4: Vérification détaillée des résultats
-- =============================================

SELECT 
    wallet_address,
    dexscreener_tokens_with_market_cap as original_total,
    dexscreener_micro_cap_count as micro,
    dexscreener_low_cap_count as low,
    dexscreener_middle_cap_count as middle,
    dexscreener_large_cap_count as large,
    dexscreener_mega_cap_count as mega,
    dexscreener_unknown_cap_count as unknown,
    (COALESCE(dexscreener_micro_cap_count,0) + COALESCE(dexscreener_low_cap_count,0) + 
     COALESCE(dexscreener_middle_cap_count,0) + COALESCE(dexscreener_large_cap_count,0) + 
     COALESCE(dexscreener_mega_cap_count,0) + COALESCE(dexscreener_unknown_cap_count,0)) as calculated_total,
    copy_trading_score,
    pnl_30d,
    trade_count_30d,
    CASE 
        WHEN dexscreener_tokens_with_market_cap = 
             (COALESCE(dexscreener_micro_cap_count,0) + COALESCE(dexscreener_low_cap_count,0) + 
              COALESCE(dexscreener_middle_cap_count,0) + COALESCE(dexscreener_large_cap_count,0) + 
              COALESCE(dexscreener_mega_cap_count,0) + COALESCE(dexscreener_unknown_cap_count,0))
        THEN '✅ COHÉRENT'
        ELSE '❌ INCOHÉRENT'
    END as coherence_check
FROM wallet_registry 
WHERE dexscreener_tokens_with_market_cap > 0
ORDER BY dexscreener_tokens_with_market_cap DESC
LIMIT 10;

-- ÉTAPE 5: Statistiques globales
-- ==============================

SELECT 
    COUNT(*) as total_wallets_processed,
    COUNT(CASE WHEN dexscreener_micro_cap_count IS NOT NULL THEN 1 END) as wallets_with_new_data,
    AVG(dexscreener_tokens_with_market_cap) as avg_original_tokens,
    AVG(COALESCE(dexscreener_micro_cap_count,0) + COALESCE(dexscreener_low_cap_count,0) + 
        COALESCE(dexscreener_middle_cap_count,0) + COALESCE(dexscreener_large_cap_count,0) + 
        COALESCE(dexscreener_mega_cap_count,0) + COALESCE(dexscreener_unknown_cap_count,0)) as avg_calculated_tokens,
    AVG(copy_trading_score) as avg_copy_score,
    MIN(copy_trading_score) as min_copy_score,
    MAX(copy_trading_score) as max_copy_score,
    -- Distribution par type de market cap
    ROUND(AVG(COALESCE(dexscreener_micro_cap_count,0))::numeric, 1) as avg_micro_tokens,
    ROUND(AVG(COALESCE(dexscreener_low_cap_count,0))::numeric, 1) as avg_low_tokens,
    ROUND(AVG(COALESCE(dexscreener_middle_cap_count,0))::numeric, 1) as avg_middle_tokens,
    ROUND(AVG(COALESCE(dexscreener_large_cap_count,0))::numeric, 1) as avg_large_tokens,
    ROUND(AVG(COALESCE(dexscreener_mega_cap_count,0))::numeric, 1) as avg_mega_tokens
FROM wallet_registry 
WHERE dexscreener_tokens_with_market_cap > 0;

-- Documentation des colonnes
COMMENT ON COLUMN wallet_registry.dexscreener_micro_cap_count IS 'Tokens avec market cap < 1M USD';
COMMENT ON COLUMN wallet_registry.dexscreener_low_cap_count IS 'Tokens avec market cap 1M-10M USD';
COMMENT ON COLUMN wallet_registry.dexscreener_middle_cap_count IS 'Tokens avec market cap 10M-100M USD';
COMMENT ON COLUMN wallet_registry.dexscreener_large_cap_count IS 'Tokens avec market cap 100M-1B USD';
COMMENT ON COLUMN wallet_registry.dexscreener_mega_cap_count IS 'Tokens avec market cap > 1B USD';
COMMENT ON COLUMN wallet_registry.dexscreener_unknown_cap_count IS 'Tokens sans market cap DexScreener';

SELECT 'Migration et calculs terminés avec succès! ✅' as status;

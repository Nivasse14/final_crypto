-- SOLUTION COMPLÈTE: Créer et remplir toutes les colonnes manquantes
-- À exécuter dans le SQL Editor de Supabase

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

-- ÉTAPE 2: Fonction pour calculer et remplir automatiquement
-- =========================================================

CREATE OR REPLACE FUNCTION calculate_and_update_dexscreener_metrics()
RETURNS TABLE(
    wallet_addr TEXT,
    tokens_with_cap INTEGER,
    micro_calculated INTEGER,
    low_calculated INTEGER,
    middle_calculated INTEGER,
    large_calculated INTEGER,
    mega_calculated INTEGER,
    unknown_calculated INTEGER,
    total_calculated INTEGER,        copy_score INTEGER
) AS $$
DECLARE
    wallet_record RECORD;
    portfolio_tokens jsonb;
    pnl_tokens jsonb;
    token jsonb;
    market_cap numeric;
    micro_count INTEGER := 0;
    low_count INTEGER := 0;
    middle_count INTEGER := 0;
    large_count INTEGER := 0;
    mega_count INTEGER := 0;
    unknown_count INTEGER := 0;
    total_analyzed INTEGER := 0;
    calculated_copy_score INTEGER := 0;
    updated_count INTEGER := 0;
    
    -- Scores pour copy_trading_score
    winrate_score numeric := 0;
    pnl_score numeric := 0;
    activity_score numeric := 0;
    roi_score numeric := 0;
BEGIN
    -- Parcourir tous les wallets avec données enrichies
    FOR wallet_record IN 
        SELECT wallet_address, cielo_complete_data, 
               enriched_total_pnl_usd, enriched_winrate, 
               enriched_total_trades, enriched_roi_percentage,
               dexscreener_tokens_with_market_cap
        FROM wallet_registry 
        WHERE cielo_complete_data IS NOT NULL 
        AND dexscreener_tokens_with_market_cap > 0
    LOOP
        -- Réinitialiser les compteurs
        micro_count := 0;
        low_count := 0;
        middle_count := 0;
        large_count := 0;
        mega_count := 0;
        unknown_count := 0;
        total_analyzed := 0;
        
        -- Analyser portfolio tokens
        portfolio_tokens := wallet_record.cielo_complete_data->'enriched_portfolio'->'enriched_tokens';
        IF portfolio_tokens IS NOT NULL THEN
            FOR token IN SELECT jsonb_array_elements(portfolio_tokens)
            LOOP
                market_cap := NULLIF((token->'dexscreener_data'->'financial_data'->>'market_cap'), '')::numeric;
                IF market_cap IS NOT NULL AND market_cap > 0 THEN
                    total_analyzed := total_analyzed + 1;
                    IF market_cap < 1000000 THEN
                        micro_count := micro_count + 1;
                    ELSIF market_cap < 10000000 THEN
                        low_count := low_count + 1;
                    ELSIF market_cap < 100000000 THEN
                        middle_count := middle_count + 1;
                    ELSIF market_cap < 1000000000 THEN
                        large_count := large_count + 1;
                    ELSE
                        mega_count := mega_count + 1;
                    END IF;
                ELSE
                    unknown_count := unknown_count + 1;
                    total_analyzed := total_analyzed + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Analyser PnL tokens
        pnl_tokens := wallet_record.cielo_complete_data->'enriched_pnl'->'enriched_tokens';
        IF pnl_tokens IS NOT NULL THEN
            FOR token IN SELECT jsonb_array_elements(pnl_tokens)
            LOOP
                market_cap := NULLIF((token->'dexscreener_data'->'financial_data'->>'market_cap'), '')::numeric;
                IF market_cap IS NOT NULL AND market_cap > 0 THEN
                    total_analyzed := total_analyzed + 1;
                    IF market_cap < 1000000 THEN
                        micro_count := micro_count + 1;
                    ELSIF market_cap < 10000000 THEN
                        low_count := low_count + 1;
                    ELSIF market_cap < 100000000 THEN
                        middle_count := middle_count + 1;
                    ELSIF market_cap < 1000000000 THEN
                        large_count := large_count + 1;
                    ELSE
                        mega_count := mega_count + 1;
                    END IF;
                ELSE
                    unknown_count := unknown_count + 1;
                    total_analyzed := total_analyzed + 1;
                END IF;
            END LOOP;
        END IF;
        
        -- Calculer copy_trading_score (0-100)
        winrate_score := LEAST((COALESCE(wallet_record.enriched_winrate, 0) * 30), 30);
        
        IF COALESCE(wallet_record.enriched_total_pnl_usd, 0) > 0 THEN
            pnl_score := LEAST(ln(COALESCE(wallet_record.enriched_total_pnl_usd, 0) + 1) * 5, 25);
        ELSE
            pnl_score := 0;
        END IF;
        
        IF COALESCE(wallet_record.enriched_total_trades, 0) > 0 THEN
            activity_score := LEAST(ln(COALESCE(wallet_record.enriched_total_trades, 0) + 1) * 6, 20);
        ELSE
            activity_score := 0;
        END IF;
        
        IF COALESCE(wallet_record.enriched_roi_percentage, 0) > 0 THEN
            roi_score := LEAST(COALESCE(wallet_record.enriched_roi_percentage, 0) / 4, 25);
        ELSE
            roi_score := 0;
        END IF;
        
        calculated_copy_score := LEAST(ROUND(winrate_score + pnl_score + activity_score + roi_score)::integer, 100);
        
        -- Mettre à jour le wallet
        UPDATE wallet_registry SET
            dexscreener_micro_cap_count = micro_count,
            dexscreener_low_cap_count = low_count,
            dexscreener_middle_cap_count = middle_count,
            dexscreener_large_cap_count = large_count,
            dexscreener_mega_cap_count = mega_count,
            dexscreener_unknown_cap_count = unknown_count,
            dexscreener_total_analyzed_count = total_analyzed,
            copy_trading_score = calculated_copy_score,
            -- Approximation métriques 30j (10% du total)
            pnl_30d = ROUND((COALESCE(enriched_total_pnl_usd, 0) * 0.1)::numeric, 2),
            trade_count_30d = ROUND(COALESCE(enriched_total_trades, 0) * 0.1),
            winrate_30d = COALESCE(enriched_winrate, 0),
            roi_pct_30d = ROUND((COALESCE(enriched_roi_percentage, 0) * 0.1)::numeric, 2)
        WHERE wallet_address = wallet_record.wallet_address;
        
        -- Retourner les résultats pour debug
        wallet_addr := wallet_record.wallet_address;
        tokens_with_cap := wallet_record.dexscreener_tokens_with_market_cap;
        micro_calculated := micro_count;
        low_calculated := low_count;
        middle_calculated := middle_count;
        large_calculated := large_count;
        mega_calculated := mega_count;
        unknown_calculated := unknown_count;
        total_calculated := total_analyzed;
        copy_score := calculated_copy_score;
        
        RETURN NEXT;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Mis à jour % wallets au total', updated_count;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 3: Exécuter la fonction de remplissage
-- ============================================

SELECT * FROM calculate_and_update_dexscreener_metrics();

-- ÉTAPE 4: Vérification des résultats
-- ===================================

SELECT 
  wallet_address,
  dexscreener_tokens_with_market_cap as total_with_cap,
  dexscreener_micro_cap_count as micro,
  dexscreener_low_cap_count as low,
  dexscreener_middle_cap_count as middle,
  dexscreener_large_cap_count as large,
  dexscreener_mega_cap_count as mega,
  dexscreener_unknown_cap_count as unknown,
  (dexscreener_micro_cap_count + dexscreener_low_cap_count + 
   dexscreener_middle_cap_count + dexscreener_large_cap_count + 
   dexscreener_mega_cap_count + dexscreener_unknown_cap_count) as total_calculated,
  copy_trading_score,
  pnl_30d,
  trade_count_30d,
  winrate_30d,
  roi_pct_30d
FROM wallet_registry 
WHERE dexscreener_tokens_with_market_cap > 0
ORDER BY last_processed_at DESC
LIMIT 10;

-- ÉTAPE 5: Validation de la cohérence
-- ===================================

SELECT 
  COUNT(*) as wallets_processed,
  AVG(dexscreener_tokens_with_market_cap) as avg_tokens_with_cap,
  AVG(dexscreener_micro_cap_count + dexscreener_low_cap_count + 
      dexscreener_middle_cap_count + dexscreener_large_cap_count + 
      dexscreener_mega_cap_count + dexscreener_unknown_cap_count) as avg_calculated_total,
  AVG(copy_trading_score) as avg_copy_score,
  MIN(copy_trading_score) as min_copy_score,
  MAX(copy_trading_score) as max_copy_score
FROM wallet_registry 
WHERE dexscreener_tokens_with_market_cap > 0 
AND dexscreener_micro_cap_count IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN wallet_registry.dexscreener_micro_cap_count IS 'Nombre de tokens avec market cap < 1M USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_low_cap_count IS 'Nombre de tokens avec market cap 1M-10M USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_middle_cap_count IS 'Nombre de tokens avec market cap 10M-100M USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_large_cap_count IS 'Nombre de tokens avec market cap 100M-1B USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_mega_cap_count IS 'Nombre de tokens avec market cap > 1B USD (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_unknown_cap_count IS 'Nombre de tokens sans données market cap (DexScreener)';
COMMENT ON COLUMN wallet_registry.dexscreener_total_analyzed_count IS 'Nombre total de tokens analysés par DexScreener';

SELECT 'Migration et remplissage terminés avec succès!' as status;

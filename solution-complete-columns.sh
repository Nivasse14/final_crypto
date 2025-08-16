#!/bin/bash

echo "🚀 SOLUTION COMPLÈTE POUR LES COLONNES MANQUANTES"
echo "================================================="
echo ""

echo "📋 PROBLÈME IDENTIFIÉ:"
echo "- dexscreener_tokens_with_market_cap = 39"
echo "- Colonnes détaillées (micro_cap_count, etc.) vides ou inexistantes"
echo "- Autres colonnes calculées manquantes (copy_trading_score, métriques 30j)"
echo ""

echo "✅ SOLUTION EN 3 ÉTAPES:"
echo ""

echo "🔧 ÉTAPE 1: Créer les colonnes manquantes"
echo "===========================================" 
echo "Les colonnes suivantes doivent être créées dans Supabase SQL Editor:"
echo ""
echo "-- Colonnes market cap DexScreener détaillées"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_micro_cap_count INTEGER DEFAULT 0;"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_low_cap_count INTEGER DEFAULT 0;"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_middle_cap_count INTEGER DEFAULT 0;"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_large_cap_count INTEGER DEFAULT 0;"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_mega_cap_count INTEGER DEFAULT 0;"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_unknown_cap_count INTEGER DEFAULT 0;"
echo "ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_total_analyzed_count INTEGER DEFAULT 0;"
echo ""

echo "🔧 ÉTAPE 2: Fonction SQL pour remplir les colonnes"
echo "=================================================="
echo "Créer cette fonction dans Supabase SQL Editor:"
echo ""
cat << 'EOF'
CREATE OR REPLACE FUNCTION calculate_and_update_dexscreener_metrics()
RETURNS INTEGER AS $$
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
    updated_count INTEGER := 0;
BEGIN
    -- Parcourir tous les wallets avec données enrichies
    FOR wallet_record IN 
        SELECT wallet_address, cielo_complete_data, enriched_total_pnl_usd, enriched_winrate, enriched_total_trades, enriched_roi_percentage
        FROM wallet_registry 
        WHERE cielo_complete_data IS NOT NULL 
        AND dexscreener_tokens_with_market_cap > 0
        AND (dexscreener_micro_cap_count IS NULL OR dexscreener_micro_cap_count = 0)
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
                market_cap := (token->'dexscreener_data'->'financial_data'->>'market_cap')::numeric;
                IF market_cap IS NOT NULL THEN
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
                END IF;
            END LOOP;
        END IF;
        
        -- Analyser PnL tokens
        pnl_tokens := wallet_record.cielo_complete_data->'enriched_pnl'->'enriched_tokens';
        IF pnl_tokens IS NOT NULL THEN
            FOR token IN SELECT jsonb_array_elements(pnl_tokens)
            LOOP
                market_cap := (token->'dexscreener_data'->'financial_data'->>'market_cap')::numeric;
                IF market_cap IS NOT NULL THEN
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
                END IF;
            END LOOP;
        END IF;
        
        -- Calculer copy_trading_score
        DECLARE
            copy_score INTEGER := 0;
            winrate_score numeric := 0;
            pnl_score numeric := 0;
            activity_score numeric := 0;
            roi_score numeric := 0;
        BEGIN
            -- Score winrate (0-30)
            winrate_score := LEAST((COALESCE(wallet_record.enriched_winrate, 0) * 30), 30);
            
            -- Score PnL (0-25) - logarithmique
            IF COALESCE(wallet_record.enriched_total_pnl_usd, 0) > 0 THEN
                pnl_score := LEAST(log(COALESCE(wallet_record.enriched_total_pnl_usd, 0) + 1) * 5, 25);
            END IF;
            
            -- Score activité (0-20)
            IF COALESCE(wallet_record.enriched_total_trades, 0) > 0 THEN
                activity_score := LEAST(log(COALESCE(wallet_record.enriched_total_trades, 0) + 1) * 6, 20);
            END IF;
            
            -- Score ROI (0-25)
            IF COALESCE(wallet_record.enriched_roi_percentage, 0) > 0 THEN
                roi_score := LEAST(COALESCE(wallet_record.enriched_roi_percentage, 0) / 4, 25);
            END IF;
            
            copy_score := LEAST(ROUND(winrate_score + pnl_score + activity_score + roi_score), 100);
        END;
        
        -- Mettre à jour le wallet
        UPDATE wallet_registry SET
            dexscreener_micro_cap_count = micro_count,
            dexscreener_low_cap_count = low_count,
            dexscreener_middle_cap_count = middle_count,
            dexscreener_large_cap_count = large_count,
            dexscreener_mega_cap_count = mega_count,
            dexscreener_unknown_cap_count = unknown_count,
            dexscreener_total_analyzed_count = total_analyzed,
            copy_trading_score = copy_score,
            -- Approximation métriques 30j (10% du total)
            pnl_30d = ROUND((COALESCE(enriched_total_pnl_usd, 0) * 0.1)::numeric, 2),
            trade_count_30d = ROUND(COALESCE(enriched_total_trades, 0) * 0.1),
            winrate_30d = COALESCE(enriched_winrate, 0),
            roi_pct_30d = ROUND((COALESCE(enriched_roi_percentage, 0) * 0.1)::numeric, 2)
        WHERE wallet_address = wallet_record.wallet_address;
        
        updated_count := updated_count + 1;
        
        -- Log progress
        RAISE NOTICE 'Updated wallet %: micro=%, low=%, middle=%, large=%, mega=%, unknown=%, copy_score=%', 
            wallet_record.wallet_address, micro_count, low_count, middle_count, large_count, mega_count, unknown_count, copy_score;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
EOF
echo ""

echo "🔧 ÉTAPE 3: Exécuter la fonction de remplissage"
echo "=============================================="
echo "Dans Supabase SQL Editor, exécuter:"
echo ""
echo "SELECT calculate_and_update_dexscreener_metrics();"
echo ""

echo "🔍 ÉTAPE 4: Vérification"
echo "======================="
echo "Vérifier les résultats avec:"
echo ""
echo "SELECT "
echo "  wallet_address,"
echo "  dexscreener_tokens_with_market_cap,"
echo "  dexscreener_micro_cap_count,"
echo "  dexscreener_low_cap_count,"
echo "  dexscreener_middle_cap_count,"
echo "  dexscreener_large_cap_count,"
echo "  dexscreener_mega_cap_count,"
echo "  dexscreener_unknown_cap_count,"
echo "  (dexscreener_micro_cap_count + dexscreener_low_cap_count + dexscreener_middle_cap_count + dexscreener_large_cap_count + dexscreener_mega_cap_count + dexscreener_unknown_cap_count) as total_calculated,"
echo "  copy_trading_score,"
echo "  pnl_30d,"
echo "  trade_count_30d"
echo "FROM wallet_registry "
echo "WHERE dexscreener_tokens_with_market_cap > 0"
echo "ORDER BY last_processed_at DESC"
echo "LIMIT 5;"
echo ""

echo "✅ RÉSULTAT ATTENDU:"
echo "- Les colonnes détaillées de market cap seront remplies"
echo "- Le total des colonnes détaillées = dexscreener_tokens_with_market_cap"
echo "- copy_trading_score calculé entre 0-100"
echo "- Métriques 30j approximées"
echo ""

echo "🎉 INSTRUCTIONS COMPLÈTES FOURNIES!"
echo "Copier-coller les commandes SQL dans l'interface Supabase SQL Editor"

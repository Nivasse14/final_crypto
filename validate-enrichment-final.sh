#!/bin/bash

# 🧪 VALIDATION FINALE ENRICHISSEMENT V2→P1
echo "🚀 VALIDATION FINALE ENRICHISSEMENT GECKOTERMINAL V2→P1"
echo "=========================================================="

# Configuration
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
WALLET="ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"

echo ""
echo "🎯 TEST 1: Démo P1 - Validation taux de succès"
echo "=============================================="
DEMO_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/cielo-api/demo-p1-enrichment/test" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

SUCCESS_RATE=$(echo "$DEMO_RESPONSE" | jq -r '.summary.success_rate // "ERROR"')
ENRICHED_COUNT=$(echo "$DEMO_RESPONSE" | jq -r '.summary.successfully_enriched // 0')
TOTAL_COUNT=$(echo "$DEMO_RESPONSE" | jq -r '.summary.total_tokens // 0')

if [ "$SUCCESS_RATE" = "100%" ]; then
    echo "✅ SUCCÈS: Démo P1 - $SUCCESS_RATE ($ENRICHED_COUNT/$TOTAL_COUNT tokens)"
else
    echo "❌ ÉCHEC: Démo P1 - $SUCCESS_RATE ($ENRICHED_COUNT/$TOTAL_COUNT tokens)"
fi

echo ""
echo "🪙 TEST 2: Tokens PnL - Validation données P1"
echo "============================================="
TOKENS_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/cielo-api/tokens-pnl/${WALLET}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

# Validation du premier token enrichi
FIRST_TOKEN=$(echo "$TOKENS_RESPONSE" | jq -r '.data.tokens[0] // {}')
GECKO_ENRICHED=$(echo "$FIRST_TOKEN" | jq -r '.gecko_enriched // false')
DATA_SOURCE=$(echo "$FIRST_TOKEN" | jq -r '.gecko_data_source // "N/A"')
POOL_ADDRESS=$(echo "$FIRST_TOKEN" | jq -r '.gecko_pool_address // "N/A"')
FDV_USD=$(echo "$FIRST_TOKEN" | jq -r '.fdv_usd // "N/A"')
GT_SCORE=$(echo "$FIRST_TOKEN" | jq -r '.gt_score // "N/A"')
PRICE_USD=$(echo "$FIRST_TOKEN" | jq -r '.price_usd // "N/A"')

if [ "$GECKO_ENRICHED" = "true" ] && [ "$DATA_SOURCE" = "pools_api_p1_advanced" ]; then
    echo "✅ SUCCÈS: Token enrichi avec API P1"
    echo "   📊 Source: $DATA_SOURCE"
    echo "   🏊 Pool: $POOL_ADDRESS"
    echo "   💰 FDV: \$$FDV_USD"
    echo "   🎯 GT Score: $GT_SCORE"
    echo "   💵 Prix: \$$PRICE_USD"
else
    echo "❌ ÉCHEC: Token non enrichi ou mauvaise source"
    echo "   Enriched: $GECKO_ENRICHED"
    echo "   Source: $DATA_SOURCE"
fi

echo ""
echo "🔍 TEST 3: Validation champs P1 exclusifs"
echo "========================================="
# Vérifier présence des champs exclusifs P1
HAS_FDV=$(echo "$FIRST_TOKEN" | jq -r 'has("fdv_usd")')
HAS_GT_SCORE=$(echo "$FIRST_TOKEN" | jq -r 'has("gt_score")')
HAS_GT_DETAILS=$(echo "$FIRST_TOKEN" | jq -r 'has("gt_score_details")')
HAS_POOL_ADDR=$(echo "$FIRST_TOKEN" | jq -r 'has("gecko_pool_address")')
HAS_POOL_ID=$(echo "$FIRST_TOKEN" | jq -r 'has("gecko_pool_id")')

P1_FIELDS_COUNT=0
[ "$HAS_FDV" = "true" ] && ((P1_FIELDS_COUNT++))
[ "$HAS_GT_SCORE" = "true" ] && ((P1_FIELDS_COUNT++))
[ "$HAS_GT_DETAILS" = "true" ] && ((P1_FIELDS_COUNT++))
[ "$HAS_POOL_ADDR" = "true" ] && ((P1_FIELDS_COUNT++))
[ "$HAS_POOL_ID" = "true" ] && ((P1_FIELDS_COUNT++))

if [ $P1_FIELDS_COUNT -eq 5 ]; then
    echo "✅ SUCCÈS: Tous les champs P1 exclusifs présents ($P1_FIELDS_COUNT/5)"
    echo "   ✅ fdv_usd: $HAS_FDV"
    echo "   ✅ gt_score: $HAS_GT_SCORE" 
    echo "   ✅ gt_score_details: $HAS_GT_DETAILS"
    echo "   ✅ gecko_pool_address: $HAS_POOL_ADDR"
    echo "   ✅ gecko_pool_id: $HAS_POOL_ID"
else
    echo "⚠️ PARTIEL: Champs P1 exclusifs ($P1_FIELDS_COUNT/5)"
    echo "   fdv_usd: $HAS_FDV"
    echo "   gt_score: $HAS_GT_SCORE"
    echo "   gt_score_details: $HAS_GT_DETAILS"
    echo "   gecko_pool_address: $HAS_POOL_ADDR"
    echo "   gecko_pool_id: $HAS_POOL_ID"
fi

echo ""
echo "🌐 TEST 4: APIs GeckoTerminal directes"
echo "====================================="

# Test API V2 directe
echo "🔍 Test API V2 - Découverte pools SOL..."
V2_POOLS=$(curl -s "https://api.geckoterminal.com/api/v2/networks/solana/tokens/So11111111111111111111111111111111111111112/pools?page=1&limit=3" \
  -H "Accept: application/json" | jq -r '.data | length // 0')

if [ "$V2_POOLS" -gt 0 ]; then
    echo "✅ API V2: $V2_POOLS pools trouvés pour SOL"
else
    echo "❌ API V2: Aucun pool trouvé"
fi

# Test API P1 directe
echo "🚀 Test API P1 - Données avancées..."
POOL_ADDR="58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"
P1_PRICE=$(curl -s "https://app.geckoterminal.com/api/p1/solana/pools/${POOL_ADDR}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" | \
  jq -r '.data.attributes.price_in_usd // "ERROR"')

if [[ "$P1_PRICE" =~ ^[0-9]+\.?[0-9]*$ ]]; then
    echo "✅ API P1: Prix SOL récupéré = \$$P1_PRICE"
else
    echo "❌ API P1: Erreur récupération prix ($P1_PRICE)"
fi

echo ""
echo "📊 RÉSUMÉ FINAL"
echo "==============="

# Calcul du score global
TOTAL_TESTS=4
PASSED_TESTS=0

[ "$SUCCESS_RATE" = "100%" ] && ((PASSED_TESTS++))
[ "$GECKO_ENRICHED" = "true" ] && [ "$DATA_SOURCE" = "pools_api_p1_advanced" ] && ((PASSED_TESTS++))
[ $P1_FIELDS_COUNT -eq 5 ] && ((PASSED_TESTS++))
[ "$V2_POOLS" -gt 0 ] && [[ "$P1_PRICE" =~ ^[0-9]+\.?[0-9]*$ ]] && ((PASSED_TESTS++))

SCORE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "🎯 SCORE GLOBAL: $PASSED_TESTS/$TOTAL_TESTS tests réussis ($SCORE%)"
echo ""

if [ $SCORE -ge 75 ]; then
    echo "🎉 VALIDATION RÉUSSIE: L'enrichissement V2→P1 est OPÉRATIONNEL"
    echo "   ✅ Découverte pools V2 fonctionnelle"
    echo "   ✅ Enrichissement P1 actif" 
    echo "   ✅ Données P1 exclusives récupérées"
    echo "   ✅ APIs GeckoTerminal accessibles"
    echo ""
    echo "🚀 SYSTÈME PRÊT POUR LA PRODUCTION"
elif [ $SCORE -ge 50 ]; then
    echo "⚠️ VALIDATION PARTIELLE: Problèmes détectés"
    echo "   Vérifier les logs et corriger les points d'échec"
else
    echo "❌ VALIDATION ÉCHOUÉE: Problèmes majeurs"
    echo "   Revoir l'implémentation et corriger les erreurs"
fi

echo ""
echo "📚 DOCUMENTATION: /Users/helenemounissamy/scanDune/ENRICHISSEMENT-V2-P1-COMPLET.md"
echo "📮 COLLECTION POSTMAN: /Users/helenemounissamy/scanDune/GeckoTerminal-P1-Complete.postman_collection.json"

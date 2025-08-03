#!/bin/bash

# Test complet de persistance des données Supabase
echo "🔍 Test complet de persistance des données dans Supabase"
echo "============================================="

API_BASE="https://xkndddxqqlxqknbqtefv.supabase.co"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
REST_AUTH="apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Étape 1: Vérifier l'état initial de la table
echo "📋 1. État initial de la table wallet_tokens_extended..."
INITIAL_COUNT=$(curl -s -X GET "$API_BASE/rest/v1/wallet_tokens_extended?select=count" \
    -H "$REST_AUTH" \
    -H "$AUTH_HEADER" | jq -r '.[0].count // 0')
echo "   → Nombre total de tokens: $INITIAL_COUNT"

# Étape 2: Test de sauvegarde directe avec save-tokens-simple
echo ""
echo "💾 2. Test de sauvegarde directe avec save-tokens-simple..."
TEST_WALLET="DEMO_PERSISTENCE_TEST_$(date +%s)"
SAVE_RESULT=$(curl -s -X POST "$API_BASE/functions/v1/save-tokens-simple" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
        \"walletAddress\": \"$TEST_WALLET\",
        \"tokensData\": [
            {
                \"token_address\": \"DEMO_TOKEN_1_$(date +%s)\",
                \"symbol\": \"DEMO1\",
                \"name\": \"Demo Token 1\",
                \"pnl_usd\": 1500.50,
                \"market_cap_usd\": 75000000,
                \"gecko_price_usd\": 1.25
            },
            {
                \"token_address\": \"DEMO_TOKEN_2_$(date +%s)\",
                \"symbol\": \"DEMO2\",
                \"name\": \"Demo Token 2\",
                \"pnl_usd\": -250.75,
                \"market_cap_usd\": 25000000,
                \"gecko_price_usd\": 0.85
            }
        ]
    }")

SAVE_SUCCESS=$(echo "$SAVE_RESULT" | jq -r '.success')
TOKENS_SAVED=$(echo "$SAVE_RESULT" | jq -r '.tokens_saved')
echo "   → Succès: $SAVE_SUCCESS"
echo "   → Tokens sauvegardés: $TOKENS_SAVED"

# Étape 3: Vérifier que les données sont bien en base
echo ""
echo "🔍 3. Vérification des données sauvegardées..."
sleep 2  # Petit délai pour laisser le temps à la BDD
DEMO_TOKENS=$(curl -s -X GET "$API_BASE/rest/v1/wallet_tokens_extended?select=*&wallet_address=eq.$TEST_WALLET" \
    -H "$REST_AUTH" \
    -H "$AUTH_HEADER")

DEMO_COUNT=$(echo "$DEMO_TOKENS" | jq '. | length')
echo "   → Tokens récupérés pour $TEST_WALLET: $DEMO_COUNT"

if [ "$DEMO_COUNT" -gt 0 ]; then
    echo "   → Premier token:"
    echo "$DEMO_TOKENS" | jq -r '.[0] | "     - Adresse: \(.token_address)\n     - Symbole: \(.token_symbol)\n     - PnL: \(.pnl)\n     - Prix: \(.current_price_usd)\n     - Enrichi: \(.geckoterminal_enriched)"'
fi

# Étape 4: Test avec l'endpoint demo-p1-enrichment
echo ""
echo "🧪 4. Test avec demo-p1-enrichment (enrichissement + auto-sauvegarde)..."
DEMO_ENRICH_RESULT=$(curl -s -X GET "$API_BASE/functions/v1/cielo-api/demo-p1-enrichment" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json")

ENRICH_SUCCESS=$(echo "$DEMO_ENRICH_RESULT" | jq -r '.success')
ENRICHED_COUNT=$(echo "$DEMO_ENRICH_RESULT" | jq -r '.summary.successfully_enriched')
echo "   → Succès enrichissement: $ENRICH_SUCCESS"
echo "   → Tokens enrichis: $ENRICHED_COUNT"

# Étape 5: Vérifier l'état final de la table
echo ""
echo "📊 5. État final de la table..."
sleep 2
FINAL_COUNT=$(curl -s -X GET "$API_BASE/rest/v1/wallet_tokens_extended?select=count" \
    -H "$REST_AUTH" \
    -H "$AUTH_HEADER" | jq -r '.[0].count // 0')
echo "   → Nombre total de tokens: $FINAL_COUNT"
echo "   → Tokens ajoutés: $((FINAL_COUNT - INITIAL_COUNT))"

# Étape 6: Test d'un wallet avec enrichissement complet
echo ""
echo "🏦 6. Test avec un wallet réel via /tokens-pnl (avec enrichissement GeckoTerminal)..."
REAL_WALLET="2ojv9BAiHUrvsm9gxDe7fJSKNxZkFhW5fTUTvQYWcmFG"
TOKENS_PNL_RESULT=$(curl -s -X GET "$API_BASE/functions/v1/cielo-api/tokens-pnl/$REAL_WALLET" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json")

PNL_SUCCESS=$(echo "$TOKENS_PNL_RESULT" | jq -r '.success')
PNL_SOURCE=$(echo "$TOKENS_PNL_RESULT" | jq -r '.source')
echo "   → Succès: $PNL_SUCCESS"
echo "   → Source des données: $PNL_SOURCE"

# Étape 7: Résumé final
echo ""
echo "📋 RÉSUMÉ FINAL"
echo "==============="
echo "✅ Test de sauvegarde directe: $([[ "$SAVE_SUCCESS" == "true" ]] && echo "SUCCÈS" || echo "ÉCHEC")"
echo "✅ Vérification données en base: $([[ "$DEMO_COUNT" -gt 0 ]] && echo "SUCCÈS" || echo "ÉCHEC")"
echo "✅ Test enrichissement demo: $([[ "$ENRICH_SUCCESS" == "true" ]] && echo "SUCCÈS" || echo "ÉCHEC")"
echo "✅ Test wallet réel: $([[ "$PNL_SUCCESS" == "true" ]] && echo "SUCCÈS" || echo "ÉCHEC")"
echo ""

if [[ "$SAVE_SUCCESS" == "true" && "$DEMO_COUNT" -gt 0 && "$ENRICH_SUCCESS" == "true" ]]; then
    echo "🎉 VALIDATION COMPLÈTE: Les données sont bien persistées dans Supabase !"
    echo "   → La table wallet_tokens_extended fonctionne correctement"
    echo "   → L'enrichissement GeckoTerminal est opérationnel"
    echo "   → Les fonctions de sauvegarde sont fonctionnelles"
else
    echo "⚠️  PROBLÈME DÉTECTÉ: Certains tests ont échoué"
fi

echo ""
echo "🔗 Pour consulter les données directement:"
echo "   Dashboard Supabase: https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor"
echo "   Table: wallet_tokens_extended"

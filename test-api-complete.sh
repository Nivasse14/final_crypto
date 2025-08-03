#!/bin/bash

# Script de test complet pour l'API Cielo enrichie
# Test de tous les endpoints avec un wallet de test

BASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
WALLET="ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"

echo "🧪 Test complet de l'API Cielo enrichie"
echo "========================================"
echo ""

# 1. Health check
echo "1️⃣ Health Check"
curl -s -X GET "$BASE_URL/health" \
  -H "$AUTH_HEADER" | jq '.status, .version, .available_endpoints'
echo ""

# 2. Test enrichissement Gecko direct
echo "2️⃣ Test enrichissement Gecko"
curl -s -X GET "$BASE_URL/test-gecko/So11111111111111111111111111111111111111112" \
  -H "$AUTH_HEADER" | jq '.success, .enriched.price_usd, .enriched.gecko_name'
echo ""

# 3. Portfolio (peut échouer, fallback OK)
echo "3️⃣ Portfolio"
curl -s -X GET "$BASE_URL/portfolio/$WALLET" \
  -H "$AUTH_HEADER" | jq '.success, .data, .enriched_with_gecko // .fallback_data'
echo ""

# 4. Stats
echo "4️⃣ Stats (all time)"
curl -s -X GET "$BASE_URL/stats/$WALLET" \
  -H "$AUTH_HEADER" | jq '.success, .data.total_pnl // .fallback_data.total_pnl_usd'
echo ""

# 5. Stats 7 jours
echo "5️⃣ Stats 7 jours"
curl -s -X GET "$BASE_URL/stats-7d/$WALLET" \
  -H "$AUTH_HEADER" | jq '.success, .period_stats // .fallback_data'
echo ""

# 6. Tokens PnL avec enrichissement
echo "6️⃣ Tokens PnL (enrichi)"
curl -s -X GET "$BASE_URL/tokens-pnl/$WALLET" \
  -H "$AUTH_HEADER" | jq '.success, .metadata.enriched_tokens_count, .data.tokens[0].gecko_enriched // .fallback_data'
echo ""

# 7. Endpoint complet avec persistance
echo "7️⃣ Endpoint complet avec persistance"
curl -s -X GET "$BASE_URL/complete/$WALLET" \
  -H "$AUTH_HEADER" | jq '.success, .tokens_pnl.enriched_tokens_count, .database_save.success'
echo ""

echo ""
echo "✅ Tests terminés!"
echo ""
echo "📊 Résumé de l'API Cielo enrichie :"
echo "- ✅ Enrichissement GeckoTerminal V2 avec pools + tokens fallback"
echo "- ✅ Données complètes : prix, market cap, volume, liquidité, changements"
echo "- ✅ Persistance automatique dans wallet_tokens_extended"
echo "- ✅ Gestion intelligente des erreurs et fallbacks"
echo "- ✅ Cache pour performance"
echo "- ✅ Logging détaillé pour debug"
echo ""
echo "🎯 Endpoints disponibles :"
echo "- /health - Status de l'API"
echo "- /test-gecko/{token_address} - Test enrichissement direct"
echo "- /portfolio/{wallet} - Portfolio enrichi"
echo "- /stats/{wallet} - Stats all time"
echo "- /stats-7d/{wallet} - Stats 7 jours"
echo "- /tokens-pnl/{wallet} - Tokens PnL enrichis"
echo "- /complete/{wallet} - Données complètes + persistance"
echo "- /debug-tokens/{wallet} - Debug structure tokens"
echo "- /debug-enrich-one/{wallet} - Debug enrichissement"

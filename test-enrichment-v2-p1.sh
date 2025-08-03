#!/bin/bash

# Test de l'enrichissement V2→P1 complet
echo "🧪 TEST ENRICHISSEMENT V2→P1"
echo "============================="

# Configuration
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "📋 ÉTAPE 1: Test des endpoints de base"
echo "======================================="

# Test démo P1 (qui fonctionne)
echo "🎯 Test endpoint démo P1..."
curl -s -X GET "${SUPABASE_URL}/cielo-api/demo-p1-enrichment/test" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | \
  jq -r '.summary | "✅ Démo P1: \(.success_rate) de succès, \(.total_tokens) tokens testés"'

echo ""

# Test GeckoTerminal API directe pour SOL
echo "🦎 Test API GeckoTerminal V2 directe pour SOL..."
curl -s "https://api.geckoterminal.com/api/v2/networks/solana/tokens/So11111111111111111111111111111111111111112/pools?include=dex,base_token&page=1&limit=3" \
  -H "Accept: application/json" | \
  jq -r 'if .data and (.data | length) > 0 then "✅ GeckoTerminal V2: \(.data | length) pools trouvés pour SOL" else "❌ GeckoTerminal V2: Aucun pool trouvé" end'

echo ""

# Test API GeckoTerminal P1 directe
echo "🦎 Test API GeckoTerminal P1 directe..."
POOL_ADDRESS="58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"
curl -s "https://app.geckoterminal.com/api/p1/solana/pools/${POOL_ADDRESS}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" | \
  jq -r 'if .data and .data.attributes and .data.attributes.price_in_usd then "✅ GeckoTerminal P1: Prix SOL = $\(.data.attributes.price_in_usd)" else "❌ GeckoTerminal P1: Erreur ou pas de données" end'

echo ""
echo "📋 ÉTAPE 2: Test des endpoints métiers"
echo "======================================"

# Test tokens-pnl (endpoint qui fonctionne selon les tests précédents)
echo "🪙 Test tokens-pnl..."
WALLET="ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"
curl -s -X GET "${SUPABASE_URL}/cielo-api/tokens-pnl/${WALLET}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | \
  jq -r 'if .data and .data.tokens and (.data.tokens | length) > 0 then 
    .data.tokens[0] | 
    if .gecko_enriched then 
      "✅ Tokens-PnL: Token enrichi avec \(.gecko_data_source || "source inconnue"), FDV: $\(.fdv_usd || "N/A")" 
    else 
      "⚠️ Tokens-PnL: Token NON enrichi" 
    end
  else 
    "❌ Tokens-PnL: Pas de tokens trouvés" 
  end'

echo ""

# Test endpoint complete
echo "🎯 Test endpoint complete..."
curl -s -X GET "${SUPABASE_URL}/cielo-api/complete/${WALLET}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | \
  jq -r 'if .data and .data.tokens_pnl_enhanced and (.data.tokens_pnl_enhanced | length) > 0 then 
    .data.tokens_pnl_enhanced[0] | 
    if .gecko_enriched then 
      "✅ Complete: Token enrichi avec \(.gecko_data_source || "source inconnue"), FDV: $\(.fdv_usd || "N/A")" 
    else 
      "⚠️ Complete: Token NON enrichi" 
    end
  else 
    "❌ Complete: Pas de tokens trouvés" 
  end'

echo ""
echo "📋 ÉTAPE 3: Test de l'approche V2→P1"
echo "===================================="

# Vérifier qu'un token a bien le champ gecko_pool_address
echo "🔍 Vérification présence gecko_pool_address..."
curl -s -X GET "${SUPABASE_URL}/cielo-api/tokens-pnl/${WALLET}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | \
  jq -r '.data.tokens[0] | 
    if .gecko_pool_address and .gecko_pool_id then 
      "✅ V2→P1: Pool address = \(.gecko_pool_address), Pool ID = \(.gecko_pool_id)" 
    else 
      "⚠️ V2→P1: Pas de pool address/ID trouvé" 
    end'

echo ""

# Vérifier les données exclusives P1
echo "🎯 Vérification données exclusives P1..."
curl -s -X GET "${SUPABASE_URL}/cielo-api/tokens-pnl/${WALLET}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | \
  jq -r '.data.tokens[0] | 
    if .gt_score and .fdv_usd then 
      "✅ P1 Advanced: GT Score = \(.gt_score), FDV = $\(.fdv_usd)" 
    else 
      "⚠️ P1 Advanced: Données P1 manquantes (GT Score: \(.gt_score || "N/A"), FDV: \(.fdv_usd || "N/A"))" 
    end'

echo ""
echo "📊 RÉSUMÉ"
echo "========="
echo "Test terminé. Résultats ci-dessus."

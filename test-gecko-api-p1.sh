#!/bin/bash

# Script de test pour l'API P1 GeckoTerminal
# Ce script teste l'enrichissement avancé via l'API P1

set -e

# Configuration
BASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🦎 Test API P1 GeckoTerminal - Enrichissement Avancé${NC}"
echo "=========================================================="

# Fonction de test pour un pool spécifique
test_pool_p1() {
    local pool_address=$1
    local network=$2
    local description=$3
    
    echo ""
    echo -e "${YELLOW}📊 Test Pool P1: $description${NC}"
    echo "Pool: $pool_address"
    echo "Network: $network"
    echo "------------------------------------------------------"
    
    local start_time=$(date +%s)
    
    local response=$(curl -s -X GET \
        "$BASE_URL/cielo-api/gecko-api-test/pool-p1/$pool_address/$network" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        2>/dev/null)
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Vérifier si la réponse contient des données valides
    if echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SUCCESS${NC} (${duration}s)"
        
        # Extraire et afficher les métriques principales
        local price=$(echo "$response" | jq -r '.analysis.pool_attributes.main_metrics.price_usd // "N/A"')
        local fdv=$(echo "$response" | jq -r '.analysis.pool_attributes.main_metrics.fdv_usd // "N/A"')
        local liquidity=$(echo "$response" | jq -r '.analysis.pool_attributes.main_metrics.liquidity_usd // "N/A"')
        local gt_score=$(echo "$response" | jq -r '.analysis.pool_attributes.main_metrics.gt_score // "N/A"')
        local duration_ms=$(echo "$response" | jq -r '.analysis.duration_ms // "N/A"')
        local included_count=$(echo "$response" | jq -r '.analysis.included_count // "N/A"')
        local tokens_count=$(echo "$response" | jq -r '.analysis.tokens_included.count // "N/A"')
        
        echo "  💰 Prix USD: $price"
        echo "  📈 FDV: $fdv"
        echo "  💧 Liquidité: $liquidity"
        echo "  ⭐ GT Score: $gt_score"
        echo "  ⏱️  Durée API: ${duration_ms}ms"
        echo "  📦 Objets inclus: $included_count"
        echo "  🪙 Tokens: $tokens_count"
        
        # Afficher les tokens inclus
        echo ""
        echo "  🔍 Tokens détectés:"
        echo "$response" | jq -r '.analysis.tokens_included.tokens[]? | "    • \(.symbol) (\(.name)) - \(.address[0:8])..."'
        
        # Vérifier les capacités P1 spécifiques
        echo ""
        echo "  🚀 Capacités P1:"
        local has_fdv=$(echo "$response" | jq -r '.analysis.pool_attributes.has_fdv')
        local has_gt_score=$(echo "$response" | jq -r '.analysis.pool_attributes.has_gt_score')
        local has_price_changes=$(echo "$response" | jq -r '.analysis.pool_attributes.has_price_changes')
        
        echo "    • FDV disponible: $has_fdv"
        echo "    • GT Score disponible: $has_gt_score"
        echo "    • Variations prix disponibles: $has_price_changes"
        
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Erreur: $(echo "$response" | jq -r '.error // "Réponse invalide"')"
        echo "Réponse brute:"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Tests avec différents pools populaires
echo ""
echo "🎯 Tests sur pools populaires avec API P1"

# Pool BONK/SOL (petit token, test enrichissement)
test_pool_p1 "8MsMB9zGkescT7r3mSA6uJdFthtgx3JHAn93b8swQicT" "solana" "SDOG/SOL (Petit token meme)"

# Pool USDC/SOL (stablecoin, gros volume)
test_pool_p1 "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2" "solana" "USDC/SOL (Stablecoin, volume élevé)"

# Pool WIF/SOL (meme coin populaire)
test_pool_p1 "2qBpebJnBfFy9nG2LgVSTiHJ3WB7MZkpYz7LgvyJGJ8e" "solana" "WIF/SOL (Meme coin populaire)"

# Test avec un pool qui pourrait ne pas exister
test_pool_p1 "1234567890abcdef1234567890abcdef12345678" "solana" "Pool inexistant (test erreur)"

echo ""
echo "=========================================================="
echo -e "${BLUE}📊 Résumé des tests API P1${NC}"
echo ""
echo "L'API P1 de GeckoTerminal offre:"
echo "• 🔥 Fully Diluted Valuation (FDV) - indisponible en V2"
echo "• ⭐ GT Score - score de qualité du pool"
echo "• 📈 Données historiques détaillées"
echo "• 🔒 Informations de liquidité verrouillée"
echo "• 🏷️ Tags et métadonnées enrichies"
echo "• 🛡️ Métriques de sécurité avancées"
echo ""
echo "🎯 URL API P1 complète utilisée:"
echo "https://app.geckoterminal.com/api/p1/{network}/pools/{poolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0"
echo ""
echo -e "${GREEN}✅ Tests API P1 terminés!${NC}"

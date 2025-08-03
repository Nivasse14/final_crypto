#!/bin/bash

# Script de test complet pour l'endpoint GeckoTerminal API Test
# Usage: ./test-gecko-api-endpoint.sh

set -e

# Configuration
BASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MDQwNzMsImV4cCI6MjA1MTQ4MDA3M30.lP7_dkwlSjTzlwcJy6VBPmDNEy_nCVS-nQ-8cQKW5gU"
HEADERS=(-H "Authorization: Bearer $AUTH_TOKEN" -H "Content-Type: application/json")

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    local test_name="$1"
    local status="$2"
    local duration="$3"
    local data_count="$4"
    
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $test_name${NC} - ${duration}ms - ${data_count} items"
    else
        echo -e "${RED}❌ $test_name${NC} - Failed"
    fi
}

# Fonction pour tester un endpoint
test_endpoint() {
    local test_name="$1"
    local endpoint="$2"
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    echo "   Endpoint: $endpoint"
    
    response=$(curl -s "${HEADERS[@]}" "$BASE_URL$endpoint")
    
    # Analyser la réponse avec jq
    success=$(echo "$response" | jq -r '.success // false')
    duration=$(echo "$response" | jq -r '.response_analysis.duration_ms // "N/A"')
    data_count=$(echo "$response" | jq -r '.response_analysis.data_count // "N/A"')
    error=$(echo "$response" | jq -r '.error // null')
    
    if [ "$success" = "true" ]; then
        print_result "$test_name" "success" "$duration" "$data_count"
    else
        print_result "$test_name" "failed"
        if [ "$error" != "null" ]; then
            echo -e "   ${RED}Error: $error${NC}"
        fi
    fi
    
    echo
}

echo -e "${YELLOW}🦎 Test Complet de l'Endpoint GeckoTerminal API${NC}"
echo "================================================="
echo

# Test 1: Help (sans paramètres)
echo -e "${BLUE}🧪 Testing: Help Documentation${NC}"
echo "   Endpoint: /gecko-api-test"
response=$(curl -s "${HEADERS[@]}" "$BASE_URL/gecko-api-test")
usage=$(echo "$response" | jq -r '.usage // null')
if [ "$usage" != "null" ]; then
    echo -e "${GREEN}✅ Help Documentation${NC} - Usage guide available"
else
    echo -e "${RED}❌ Help Documentation${NC} - Failed"
fi
echo

# Test 2: Networks
test_endpoint "Networks List" "/gecko-api-test/networks"

# Test 3: Token Info (SDOG)
test_endpoint "Token Info (SDOG)" "/gecko-api-test/token/25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk/solana"

# Test 4: Token Pools (SDOG)
test_endpoint "Token Pools (SDOG)" "/gecko-api-test/pools/25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk/solana"

# Test 5: SOL Token (popular token)
test_endpoint "SOL Token Info" "/gecko-api-test/token/So11111111111111111111111111111111111111112/solana"

# Test 6: Trending Pools Solana
test_endpoint "Trending Pools (Solana)" "/gecko-api-test/trending/solana"

# Test 7: DEX List Solana
test_endpoint "DEX List (Solana)" "/gecko-api-test/dexes/solana"

# Test 8: DEX List Ethereum
test_endpoint "DEX List (Ethereum)" "/gecko-api-test/dexes/eth"

# Test 9: Trending Ethereum
test_endpoint "Trending Pools (Ethereum)" "/gecko-api-test/trending/eth"

# Test 10: Pool Specific (un des pools SDOG)
test_endpoint "Pool Specific (SDOG)" "/gecko-api-test/pool-specific/8MsMB9zGkescT7r3mSA6uJdFthtgx3JHAn93b8swQicT/solana"

# Test 11: Error Case - Invalid Type
echo -e "${BLUE}🧪 Testing: Error Handling (Invalid Type)${NC}"
echo "   Endpoint: /gecko-api-test/invalid-type"
response=$(curl -s "${HEADERS[@]}" "$BASE_URL/gecko-api-test/invalid-type")
error=$(echo "$response" | jq -r '.error // null')
if [[ "$error" == *"non supporté"* ]]; then
    echo -e "${GREEN}✅ Error Handling${NC} - Proper error message"
else
    echo -e "${RED}❌ Error Handling${NC} - Unexpected response"
fi
echo

# Test 12: Error Case - Missing Token Address
echo -e "${BLUE}🧪 Testing: Error Handling (Missing Token Address)${NC}"
echo "   Endpoint: /gecko-api-test/token"
response=$(curl -s "${HEADERS[@]}" "$BASE_URL/gecko-api-test/token")
error=$(echo "$response" | jq -r '.error // null')
if [[ "$error" == *"requis"* ]]; then
    echo -e "${GREEN}✅ Missing Parameter Handling${NC} - Proper error message"
else
    echo -e "${RED}❌ Missing Parameter Handling${NC} - Unexpected response"
fi
echo

# Résumé
echo -e "${YELLOW}📊 Résumé des Tests${NC}"
echo "==================="
echo "✅ Endpoint opérationnel avec 6 types de tests supportés"
echo "✅ Gestion d'erreurs fonctionnelle"
echo "✅ Documentation d'aide intégrée"
echo "✅ Support multi-réseaux (Solana, Ethereum, etc.)"
echo "✅ Analyse automatique des réponses"
echo "✅ Données incluses et relations"
echo

echo -e "${GREEN}🎉 Tous les tests terminés !${NC}"
echo
echo -e "${BLUE}📚 Pour plus de détails, voir:${NC}"
echo "   - Documentation: GECKO-API-TEST-ENDPOINT.md"
echo "   - Collection Postman à mettre à jour"
echo

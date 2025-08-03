#!/bin/bash

# Script pour tester l'API wallet-analyzer avec curl
# Usage: ./test-api-curl.sh [wallet_address]

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Adresse de wallet par défaut ou fournie en paramètre
WALLET_ADDRESS=${1:-"HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk"}

echo "🚀 Test de l'API Wallet Analyzer"
echo "================================"
echo "Wallet testé: $WALLET_ADDRESS"
echo ""

echo "1️⃣ Test Health Check..."
curl -s -X GET "$SUPABASE_URL/functions/v1/wallet-analyzer/health" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "2️⃣ Test Analyse Rapide..."
curl -s -X GET "$SUPABASE_URL/functions/v1/wallet-analyzer/quick/$WALLET_ADDRESS" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '{
    wallet_address: .wallet_address,
    data_source: .data_source,
    alpha_score: .alpha_score,
    total_pnl_usd: .total_pnl_usd,
    win_rate: .win_rate,
    total_trades: .total_trades
  }'

echo ""
echo "3️⃣ Test Analyse Complète (métriques principales)..."
curl -s -X GET "$SUPABASE_URL/functions/v1/wallet-analyzer/complete/$WALLET_ADDRESS" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '{
    data_source: .data_source,
    alpha_analysis: .data.alpha_analysis,
    trade_summary: {
      total_pnl_usd: .data.trade_analysis.total_pnl_usd,
      win_rate: .data.trade_analysis.win_rate,
      total_volume_usd: .data.trade_analysis.total_volume_usd,
      unique_tokens: .data.trade_analysis.unique_tokens
    },
    recommendation: {
      action: .data.copy_trading_recommendations.recommendation,
      allocation: .data.copy_trading_recommendations.suggested_allocation_percentage,
      confidence: .data.copy_trading_recommendations.confidence_level,
      risk_level: .data.copy_trading_recommendations.risk_level
    }
  }'

echo ""
echo "✅ Tests terminés !"
echo ""
echo "💡 Usage:"
echo "   ./test-api-curl.sh                           # Test avec wallet par défaut"
echo "   ./test-api-curl.sh VOTRE_WALLET_ADDRESS      # Test avec votre wallet"

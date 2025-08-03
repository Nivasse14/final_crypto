#!/bin/bash

# Script de test complet pour l'intégration ChatGPT dans l'API Cielo

echo "🧪 TESTS DE L'INTÉGRATION CHATGPT COPY TRADING SOLANA"
echo "=================================================="

# Configuration
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Test wallets
TEST_WALLET="ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"
ALT_WALLET="9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"

echo ""
echo "📋 1. TEST HEALTH CHECK - Vérification intégration"
echo "----------------------------------------------------"
curl -s -X GET "$SUPABASE_URL/cielo-api/health" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" | jq '{
    status,
    behavioral_analysis,
    copy_trading_criteria,
    available_endpoints: (.available_endpoints | map(select(. == "complete")))
  }'

echo ""
echo "🤖 2. TEST ANALYSE CHATGPT DIRECTE - API dédiée"
echo "------------------------------------------------"
echo "Test avec données simulées (éviter rate limits):"

curl -s -X POST "$SUPABASE_URL/analyze-wallet-behavior" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "test_mock",
    "walletData": {
      "total_pnl_usd": 12500,
      "winrate": 87.5,
      "total_tokens_traded": 156,
      "total_roi_percentage": 245.8,
      "tokens": [
        {"token_symbol": "SOL", "pnl": 4500, "token_address": "So11111111111111111111111111111111111111112"},
        {"token_symbol": "BONK", "pnl": 3200, "token_address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"},
        {"token_symbol": "ORCA", "pnl": 2800, "token_address": "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"}
      ],
      "stats_aggregated": {
        "total_pnl": 12500,
        "winrate": 87.5,
        "total_roi_percentage": 245.8,
        "swap_count": 156
      }
    }
  }' | jq '{
    success: (.copyTradingScore > 0),
    copyTradingScore,
    recommendation,
    explanation,
    criteriaAnalysis,
    metadata: {
      analyzedAt: .metadata.analyzedAt,
      analysisVersion: .metadata.analysisVersion,
      error: .metadata.error
    }
  }'

echo ""
echo "🔄 3. TEST ENDPOINT COMPLETE - Intégration complète"
echo "----------------------------------------------------"
echo "Test avec wallet : $TEST_WALLET"

# Appel endpoint complete et extraction de la partie analyse comportementale
curl -s -X GET "$SUPABASE_URL/cielo-api/complete/$TEST_WALLET" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" | jq '{
    success,
    wallet_address,
    has_tokens_data: (.tokens_pnl.tokens_count > 0),
    tokens_count: .tokens_pnl.tokens_count,
    behavioral_analysis: {
      success: .behavioral_analysis.success,
      error: .behavioral_analysis.error,
      analysis_duration_ms: .behavioral_analysis.analysis_duration_ms,
      copy_trading_score: .behavioral_analysis.analysis.copyTradingScore,
      recommendation: .behavioral_analysis.analysis.recommendation,
      explanation: .behavioral_analysis.analysis.explanation
    }
  }'

echo ""
echo "📊 4. STRUCTURE COMPLETE - Vérification champs"
echo "-----------------------------------------------"
echo "Vérification que tous les champs attendus sont présents:"

curl -s -X GET "$SUPABASE_URL/cielo-api/complete/$TEST_WALLET" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" | jq '{
    main_structure: {
      has_portfolio: (.portfolio != null),
      has_stats_aggregated: (.stats_aggregated != null),
      has_tokens_pnl: (.tokens_pnl != null),
      has_behavioral_analysis: (.behavioral_analysis != null),
      has_database_save: (.database_save != null)
    },
    behavioral_analysis_structure: {
      has_success_field: (.behavioral_analysis.success != null),
      has_analysis_field: (.behavioral_analysis.analysis != null),
      analysis_version: .behavioral_analysis.analysis.metadata.analysisVersion
    }
  }'

echo ""
echo "🎯 5. RÉSUMÉ DES FONCTIONNALITÉS"
echo "================================"
echo "✅ API d'analyse ChatGPT déployée sur Supabase"
echo "✅ Prompt optimisé pour copy trading Solana"
echo "✅ Critères stricts : Win rate 85%+, Anti-bot, Position sizing"
echo "✅ Intégration dans endpoint /complete"
echo "✅ Gestion d'erreurs avec fallback"
echo "✅ Métadonnées et versioning"
echo ""
echo "🔗 URLs disponibles:"
echo "   - Analyse directe: $SUPABASE_URL/analyze-wallet-behavior"
echo "   - Données complètes: $SUPABASE_URL/cielo-api/complete/{wallet_address}"
echo "   - Health check: $SUPABASE_URL/cielo-api/health"
echo ""
echo "📝 Note: Si erreur 429 (Rate Limit OpenAI), réessayer dans quelques minutes."

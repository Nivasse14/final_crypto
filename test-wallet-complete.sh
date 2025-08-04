#!/bin/bash

# Script pour tester l'endpoint complete avec authentification
# Usage: ./test-wallet-complete.sh WALLET_ADDRESS

if [ -z "$1" ]; then
    echo "❌ Usage: $0 WALLET_ADDRESS"
    echo "📝 Exemple: $0 ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"
    exit 1
fi

WALLET_ADDRESS="$1"
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🔍 Test de l'endpoint complete pour: $WALLET_ADDRESS"
echo "⏳ Appel en cours..."

# Test de l'endpoint avec mesure du temps
start_time=$(date +%s%3N)

response=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/functions/v1/cielo-api/complete/$WALLET_ADDRESS")

end_time=$(date +%s%3N)
duration=$((end_time - start_time))

# Vérifier si la réponse contient une erreur
if echo "$response" | jq -e '.code' > /dev/null 2>&1; then
    echo "❌ Erreur API:"
    echo "$response" | jq '{code, message}'
    exit 1
fi

# Extraire les métriques principales
echo "✅ Réponse reçue en ${duration}ms"
echo ""
echo "📊 RÉSUMÉ DES MÉTRIQUES:"
echo "======================"

# Source des données
source=$(echo "$response" | jq -r '.source // "unknown"')
echo "🔗 Source: $source"

# Métriques du wallet summary
wallet_summary=$(echo "$response" | jq -r '.wallet_summary_update')
if [ "$wallet_summary" != "null" ]; then
    echo ""
    echo "📈 MÉTRIQUES WALLET AGRÉGÉES:"
    echo "$wallet_summary" | jq -r '.metrics_updated | {
        total_pnl: .total_pnl,
        win_rate: .win_rate,
        token_count: .token_count,
        performance_score: .performance_score,
        last_updated: .last_updated
    }'
    
    echo ""
    echo "🔄 MÉTRIQUES DE TRADING:"
    echo "$wallet_summary" | jq -r '.metrics_updated | {
        average_holding_time: .average_holding_time,
        total_roi_percentage: .total_roi_percentage,
        swap_count: .swap_count,
        unique_trading_days: .unique_trading_days,
        consecutive_trading_days: .consecutive_trading_days,
        average_trades_per_token: .average_trades_per_token
    }'
    
    summary_success=$(echo "$wallet_summary" | jq -r '.success')
    if [ "$summary_success" = "true" ]; then
        echo "✅ Métriques sauvegardées avec succès"
    else
        echo "⚠️ Erreur sauvegarde métriques:"
        echo "$wallet_summary" | jq -r '.error'
    fi
else
    echo "⚠️ Aucune mise à jour de métriques trouvée"
fi

# Tokens analysés
tokens_count=$(echo "$response" | jq -r '.tokens_pnl.data.tokens // .tokens_pnl.tokens // [] | length')
if [ "$tokens_count" != "null" ] && [ "$tokens_count" -gt 0 ]; then
    echo ""
    echo "🪙 TOKENS ANALYSÉS: $tokens_count"
    
    # Top 3 tokens par PnL
    echo ""
    echo "🏆 TOP 3 TOKENS (PnL):"
    echo "$response" | jq -r '
        (.tokens_pnl.data.tokens // .tokens_pnl.tokens // [])
        | sort_by(-.total_pnl_usd)
        | limit(3; .[])
        | "   \(.token_symbol): $\(.total_pnl_usd | floor) (\(.roi_percentage | floor)%)"
    '
fi

# Sauvegarde en base
database_save=$(echo "$response" | jq -r '.database_save.success // "unknown"')
if [ "$database_save" = "true" ]; then
    echo ""
    echo "💾 Sauvegarde tokens: ✅"
else
    echo ""
    echo "💾 Sauvegarde tokens: ❌"
fi

echo ""
echo "🎯 Test terminé!"

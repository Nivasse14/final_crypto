#!/bin/bash

# Script pour tester que les tokens ne sont enrichis que s'ils ont des prix valides
# Usage: ./test-enrichment-validation.sh WALLET_ADDRESS

if [ -z "$1" ]; then
    echo "❌ Usage: $0 WALLET_ADDRESS"
    echo "📝 Exemple: $0 ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"
    exit 1
fi

WALLET_ADDRESS="$1"
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🔍 Test de validation de l'enrichissement Gecko pour: $WALLET_ADDRESS"
echo "⏳ Appel en cours..."

# Test de l'endpoint complete
response=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/functions/v1/cielo-api/complete/$WALLET_ADDRESS")

# Vérifier si la réponse contient une erreur
if echo "$response" | jq -e '.code' > /dev/null 2>&1; then
    echo "❌ Erreur API:"
    echo "$response" | jq '{code, message}'
    exit 1
fi

echo "✅ Réponse reçue"
echo ""

# Analyser les tokens et leur enrichissement
echo "📊 ANALYSE DE L'ENRICHISSEMENT GECKO:"
echo "===================================="

# Compter les tokens total
total_tokens=$(echo "$response" | jq -r '(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) | length')
echo "🪙 Total tokens analysés: $total_tokens"

# Compter les tokens marqués comme enrichis
gecko_enriched_count=$(echo "$response" | jq -r '(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) | map(select(.gecko_enriched == true)) | length')
echo "✅ Tokens marqués gecko_enriched=true: $gecko_enriched_count"

# Compter les tokens avec prix valides (> 0)
tokens_with_valid_price=$(echo "$response" | jq -r '(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) | map(select(.gecko_price_usd != null and (.gecko_price_usd | tonumber) > 0)) | length')
echo "💰 Tokens avec prix valides (> 0): $tokens_with_valid_price"

# Vérifier les tokens enrichis sans prix valides (ne devrait pas en avoir)
tokens_enriched_no_price=$(echo "$response" | jq -r '
(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) 
| map(select(.gecko_enriched == true and (.gecko_price_usd == null or (.gecko_price_usd | tonumber) <= 0)))
| length
')
echo "❌ Tokens enrichis SANS prix valides: $tokens_enriched_no_price"

# Vérifier les tokens avec prix mais non enrichis
tokens_with_price_not_enriched=$(echo "$response" | jq -r '
(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) 
| map(select(.gecko_enriched != true and .gecko_price_usd != null and (.gecko_price_usd | tonumber) > 0))
| length
')
echo "⚠️  Tokens avec prix mais non enrichis: $tokens_with_price_not_enriched"

echo ""
echo "🔍 DÉTAILS DES TOKENS PROBLÉMATIQUES:"
echo "==================================="

# Afficher les tokens enrichis sans prix (ne devrait pas en avoir)
echo "$response" | jq -r '
(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) 
| map(select(.gecko_enriched == true and (.gecko_price_usd == null or (.gecko_price_usd | tonumber) <= 0)))
| if length > 0 then
    "❌ TOKENS ENRICHIS SANS PRIX VALIDES:",
    .[] | "   - \(.token_symbol // "N/A") (\(.token_address)): gecko_enriched=\(.gecko_enriched), price=\(.gecko_price_usd // "null")"
  else
    "✅ Aucun token enrichi sans prix valide - CORRECT!"
  end
'

echo ""

# Afficher quelques exemples de tokens correctement enrichis
echo "✅ EXEMPLES DE TOKENS CORRECTEMENT ENRICHIS:"
echo "$response" | jq -r '
(.tokens_pnl.data.tokens // .tokens_pnl.tokens // []) 
| map(select(.gecko_enriched == true and .gecko_price_usd != null and (.gecko_price_usd | tonumber) > 0))
| limit(5; .[])
| "   - \(.token_symbol // "N/A"): $\(.gecko_price_usd) (\(.gecko_data_source // "unknown"))"
'

echo ""

# Compter les enriched_tokens dans le résumé
enriched_count_summary=$(echo "$response" | jq -r '.enriched_tokens_count // 0')
echo "📈 enriched_tokens_count dans le résumé: $enriched_count_summary"

# Validation finale
echo ""
echo "🎯 VALIDATION FINALE:"
echo "===================="

if [ "$tokens_enriched_no_price" -eq 0 ]; then
    echo "✅ SUCCÈS: Aucun token enrichi sans prix valide"
else
    echo "❌ ÉCHEC: $tokens_enriched_no_price tokens enrichis sans prix valide"
fi

if [ "$gecko_enriched_count" -eq "$tokens_with_valid_price" ]; then
    echo "✅ SUCCÈS: Nombre de tokens enrichis = nombre de tokens avec prix"
else
    echo "⚠️  INFO: $gecko_enriched_count tokens enrichis vs $tokens_with_valid_price avec prix (peut être normal si enrichissement partiel)"
fi

echo ""
echo "🏁 Test terminé!"

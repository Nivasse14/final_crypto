#!/bin/bash

# Script pour corriger l'enrichissement des wallets
# Utilise l'API cielo-api/complete pour récupérer les données et les sauvegarder correctement

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Fonction pour enrichir un wallet spécifique
fix_wallet_enrichment() {
  local wallet_address=$1
  echo "🔄 Correction de l'enrichissement pour: $wallet_address"
  
  # 1. Appeler l'API cielo-api/complete pour récupérer les données
  echo "  📊 Récupération des données via cielo-api/complete..."
  local api_response=$(curl -s "$SUPABASE_URL/functions/v1/cielo-api/complete/$wallet_address" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  if [ $? -ne 0 ] || [ -z "$api_response" ]; then
    echo "  ❌ Échec de l'appel API"
    return 1
  fi
  
  # 2. Vérifier si l'API a réussi
  local success=$(echo "$api_response" | jq -r '.success // false')
  if [ "$success" != "true" ]; then
    echo "  ❌ API retourne success=false"
    return 1
  fi
  
  # 3. Extraire les données principales depuis main_data[4]
  local main_data=$(echo "$api_response" | jq -r '.data.main_data[4].result.data.json.data // empty')
  if [ -z "$main_data" ] || [ "$main_data" = "null" ]; then
    echo "  ⚠️ Pas de données dans main_data[4]"
    return 1
  fi
  
  # 4. Extraire les métriques depuis pnl_data[0]
  local pnl_data=$(echo "$api_response" | jq -r '.data.pnl_data[0].result.data.json.data // empty')
  if [ -z "$pnl_data" ] || [ "$pnl_data" = "null" ]; then
    echo "  ⚠️ Pas de données PnL disponibles"
    pnl_data="{}"
  fi
  
  # 5. Extraire portfolio depuis main_data[1]
  local portfolio_data=$(echo "$api_response" | jq -r '.data.main_data[1].result.data // empty')
  if [ -z "$portfolio_data" ] || [ "$portfolio_data" = "null" ]; then
    echo "  ⚠️ Pas de données portfolio disponibles"
    portfolio_data="{}"
  fi
  
  # 6. Préparer les données de mise à jour avec extraction sécurisée
  echo "  🔧 Extraction des métriques..."
  
  local update_data=$(cat <<EOF
{
  "enriched_total_pnl_usd": $(echo "$main_data" | jq -r '.total_pnl // 0'),
  "enriched_winrate": $(echo "$main_data" | jq -r '.winrate // 0'),
  "enriched_total_trades": $(echo "$main_data" | jq -r '.swap_count // 0'),
  "enriched_roi_percentage": $(echo "$main_data" | jq -r '.total_roi_percentage // 0'),
  "enriched_portfolio_value_usd": $(echo "$portfolio_data" | jq -r '.total_usd // 0'),
  "enriched_portfolio_tokens": $(echo "$portfolio_data" | jq -r '.portfolio | length // 0'),
  "average_holding_time": $(echo "$main_data" | jq -r '.average_holding_time // 0'),
  "total_pnl": $(echo "$main_data" | jq -r '.total_pnl // 0'),
  "total_roi_percentage": $(echo "$main_data" | jq -r '.total_roi_percentage // 0'),
  "swap_count": $(echo "$main_data" | jq -r '.swap_count // 0'),
  "unique_trading_days": $(echo "$main_data" | jq -r '.unique_trading_days // 0'),
  "consecutive_trading_days": $(echo "$main_data" | jq -r '.consecutive_trading_days // 0'),
  "average_trades_per_token": $(echo "$main_data" | jq -r '.average_trades_per_token // 0'),
  "total_tokens_traded": $(echo "$pnl_data" | jq -r '.total_tokens_traded // 0'),
  "total_unrealized_pnl_usd": $(echo "$pnl_data" | jq -r '.total_unrealized_pnl_usd // 0'),
  "total_unrealized_roi_percentage": $(echo "$pnl_data" | jq -r '.total_unrealized_roi_percentage // 0'),
  "combined_pnl_usd": $(echo "$pnl_data" | jq -r '.combined_pnl_usd // 0'),
  "combined_roi_percentage": $(echo "$pnl_data" | jq -r '.combined_roi_percentage // 0'),
  "combined_average_hold_time": $(echo "$pnl_data" | jq -r '.combined_average_hold_time // 0'),
  "combined_median_hold_time": $(echo "$pnl_data" | jq -r '.combined_median_hold_time // 0'),
  "average_buy_amount_usd": $(echo "$main_data" | jq -r '.average_buy_amount_usd // 0'),
  "minimum_buy_amount_usd": $(echo "$main_data" | jq -r '.minimum_buy_amount_usd // 0'),
  "maximum_buy_amount_usd": $(echo "$main_data" | jq -r '.maximum_buy_amount_usd // 0'),
  "total_buy_amount_usd": $(echo "$main_data" | jq -r '.total_buy_amount_usd // 0'),
  "total_buy_count": $(echo "$main_data" | jq -r '.total_buy_count // 0'),
  "average_sell_amount_usd": $(echo "$main_data" | jq -r '.average_sell_amount_usd // 0'),
  "minimum_sell_amount_usd": $(echo "$main_data" | jq -r '.minimum_sell_amount_usd // 0'),
  "maximum_sell_amount_usd": $(echo "$main_data" | jq -r '.maximum_sell_amount_usd // 0'),
  "total_sell_amount_usd": $(echo "$main_data" | jq -r '.total_sell_amount_usd // 0'),
  "total_sell_count": $(echo "$main_data" | jq -r '.total_sell_count // 0'),
  "cielo_last_enriched_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "dexscreener_last_enriched_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "enriched_complete"
}
EOF
)
  
  # 7. Mettre à jour en base de données
  echo "  💾 Mise à jour en base de données..."
  local update_response=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/wallet_registry?wallet_address=eq.$wallet_address" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$update_data")
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Enrichissement corrigé pour: $wallet_address"
    return 0
  else
    echo "  ❌ Échec de la mise à jour BDD pour: $wallet_address"
    return 1
  fi
}

# Fonction principale
main() {
  local target_wallet=$1
  
  if [ -n "$target_wallet" ]; then
    # Traiter un wallet spécifique
    echo "🎯 Correction d'enrichissement pour le wallet: $target_wallet"
    fix_wallet_enrichment "$target_wallet"
  else
    # Traiter tous les wallets avec status="enriched" mais données vides
    echo "🔍 Recherche des wallets mal enrichis..."
    
    local bad_wallets=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=wallet_address&status=eq.enriched&enriched_total_pnl_usd=is.null" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY")
    
    local wallet_count=$(echo "$bad_wallets" | jq '. | length')
    
    if [ "$wallet_count" -eq 0 ]; then
      echo "✅ Aucun wallet mal enrichi trouvé"
      return 0
    fi
    
    echo "📊 $wallet_count wallets mal enrichis trouvés"
    echo ""
    
    local fixed=0
    local failed=0
    
    echo "$bad_wallets" | jq -r '.[].wallet_address' | while read -r wallet_address; do
      if fix_wallet_enrichment "$wallet_address"; then
        ((fixed++))
      else
        ((failed++))
      fi
      
      # Pause entre les wallets
      sleep 2
    done
    
    echo ""
    echo "🎯 Correction terminée!"
    echo "   ✅ Corrigés: $fixed"
    echo "   ❌ Échecs: $failed"
  fi
}

# Vérification des arguments
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "🔧 Script de correction d'enrichissement"
  echo "========================================="
  echo ""
  echo "Usage:"
  echo "  ./fix-enrichment.sh [WALLET_ADDRESS]"
  echo ""
  echo "Exemples:"
  echo "  ./fix-enrichment.sh                           # Corriger tous les wallets mal enrichis"
  echo "  ./fix-enrichment.sh FgNJ...pGqVN3YTXEbonk     # Corriger un wallet spécifique"
  echo ""
  exit 0
fi

# Exécution
main "$1"

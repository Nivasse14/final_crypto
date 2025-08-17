#!/bin/bash

# Script simple pour sauvegarder les métriques DexScreener depuis l'API cielo-api/complete

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Fonction pour enrichir un wallet avec les données DexScreener
save_dexscreener_metrics() {
  local wallet_address=$1
  echo "🦎 Sauvegarde DexScreener pour: $wallet_address"
  
  # 1. Récupérer les données depuis l'API cielo-api/complete
  echo "  📊 Récupération des métriques..."
  local api_response=$(curl -s "$SUPABASE_URL/functions/v1/cielo-api/complete/$wallet_address" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  if [ $? -ne 0 ] || [ -z "$api_response" ]; then
    echo "  ❌ Échec de l'appel API"
    return 1
  fi
  
  # 2. Vérifier le succès
  local success=$(echo "$api_response" | jq -r '.success // false')
  if [ "$success" != "true" ]; then
    echo "  ❌ API retourne success=false"
    return 1
  fi
  
  # 3. Extraire les métriques DexScreener précalculées
  local enrichment_stats=$(echo "$api_response" | jq -r '.enrichment_stats')
  if [ -z "$enrichment_stats" ] || [ "$enrichment_stats" = "null" ]; then
    echo "  ⚠️ Pas de stats d'enrichissement trouvées"
    return 1
  fi
  
  local enriched_portfolio=$(echo "$enrichment_stats" | jq -r '.dexscreener_enriched_portfolio_tokens // 0')
  local enriched_pnl=$(echo "$enrichment_stats" | jq -r '.dexscreener_enriched_pnl_tokens // 0')
  local tokens_with_mc=$(echo "$enrichment_stats" | jq -r '.dexscreener_tokens_with_market_cap // 0')
  local tokens_with_price=$(echo "$enrichment_stats" | jq -r '.dexscreener_tokens_with_price_data // 0')
  local avg_reliability=$(echo "$enrichment_stats" | jq -r '.dexscreener_average_reliability_score // 0')
  
  echo "  📊 Métriques DexScreener extraites:"
  echo "     📈 Portfolio enrichis: $enriched_portfolio"
  echo "     💰 PnL enrichis: $enriched_pnl"  
  echo "     🏷️ Avec market cap: $tokens_with_mc"
  echo "     💵 Avec prix: $tokens_with_price"
  echo "     🎯 Fiabilité moyenne: $avg_reliability"
  
  # 4. Extraire également les données complètes pour le stockage JSON
  local complete_data=$(echo "$api_response" | jq -r '.data')
  
  # 5. Calculer les market caps par catégorie depuis pnl_data
  echo "  🔍 Analyse des market caps par catégorie..."
  local micro=0 low=0 middle=0 large=0 mega=0 unknown=0 total_analyzed=0
  
  # Analyser depuis pnl_data si disponible
  local pnl_data=$(echo "$api_response" | jq -r '.pnl_tokens[]? // empty')
  if [ -n "$pnl_data" ]; then
    while IFS= read -r token; do
      if [ -n "$token" ] && [ "$token" != "null" ]; then
        local has_dex=$(echo "$token" | jq -r '.dexscreener_enriched // false')
        if [ "$has_dex" = "true" ]; then
          local market_cap=$(echo "$token" | jq -r '.dexscreener_data.financial_data.market_cap // null')
          if [ "$market_cap" != "null" ] && [ "$market_cap" != "0" ]; then
            ((total_analyzed++))
            if (( $(echo "$market_cap < 1000000" | bc -l) )); then
              ((micro++))
            elif (( $(echo "$market_cap < 10000000" | bc -l) )); then
              ((low++))
            elif (( $(echo "$market_cap < 100000000" | bc -l) )); then
              ((middle++))
            elif (( $(echo "$market_cap < 1000000000" | bc -l) )); then
              ((large++))
            else
              ((mega++))
            fi
          else
            ((unknown++))
            ((total_analyzed++))
          fi
        fi
      fi
    done <<< "$(echo "$api_response" | jq -c '.pnl_tokens[]? // empty')"
  fi
  
  echo "  💰 Market caps: Micro=$micro, Low=$low, Mid=$middle, Large=$large, Mega=$mega, Unknown=$unknown"
  
  # 6. Préparer la mise à jour
  local update_data=$(cat <<EOF
{
  "cielo_complete_data": $complete_data,
  "dexscreener_enriched_portfolio_tokens": $enriched_portfolio,
  "dexscreener_enriched_pnl_tokens": $enriched_pnl,
  "dexscreener_tokens_with_market_cap": $tokens_with_mc,
  "dexscreener_tokens_with_price_data": $tokens_with_price,
  "dexscreener_average_reliability_score": $avg_reliability,
  "dexscreener_micro_cap_count": $micro,
  "dexscreener_low_cap_count": $low,
  "dexscreener_middle_cap_count": $middle,
  "dexscreener_large_cap_count": $large,
  "dexscreener_mega_cap_count": $mega,
  "dexscreener_unknown_cap_count": $unknown,
  "dexscreener_total_analyzed_count": $total_analyzed,
  "dexscreener_last_enriched_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "enriched_complete_with_dexscreener"
}
EOF
)
  
  # 7. Sauvegarder en base
  echo "  💾 Sauvegarde en base de données..."
  local update_response=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/wallet_registry?wallet_address=eq.$wallet_address" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$update_data")
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Données DexScreener sauvegardées pour: $wallet_address"
    echo "     💰 $enriched_pnl tokens PnL enrichis, $tokens_with_mc avec market cap"
    return 0
  else
    echo "  ❌ Échec de la sauvegarde pour: $wallet_address"
    return 1
  fi
}

# Fonction principale
main() {
  local target_wallet=$1
  local limit=${2:-5}
  
  if [ -n "$target_wallet" ]; then
    # Traiter un wallet spécifique
    echo "🦎 Enrichissement DexScreener pour le wallet: $target_wallet"
    save_dexscreener_metrics "$target_wallet"
  else
    # Traiter les wallets enrichis
    echo "🔍 Recherche des wallets enrichis à compléter avec DexScreener..."
    
    local wallets=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=wallet_address&status=in.(enriched,enriched_complete)&limit=$limit" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY")
    
    local wallet_count=$(echo "$wallets" | jq '. | length')
    
    if [ "$wallet_count" -eq 0 ]; then
      echo "✅ Aucun wallet à enrichir trouvé"
      return 0
    fi
    
    echo "📊 $wallet_count wallets à enrichir avec DexScreener"
    echo ""
    
    local enriched=0
    local failed=0
    
    echo "$wallets" | jq -r '.[].wallet_address' | while read -r wallet_address; do
      if save_dexscreener_metrics "$wallet_address"; then
        ((enriched++))
      else
        ((failed++))
      fi
      
      # Pause entre les wallets
      sleep 2
      echo ""
    done
    
    echo ""
    echo "🦎 Enrichissement DexScreener terminé!"
    echo "   ✅ Enrichis: $enriched"  
    echo "   ❌ Échecs: $failed"
  fi
}

# Aide
if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "🦎 Script de sauvegarde DexScreener simplifié"
  echo "============================================="
  echo ""
  echo "Usage:"
  echo "  ./save-dexscreener.sh [WALLET_ADDRESS] [LIMIT]"
  echo ""
  echo "Exemples:"
  echo "  ./save-dexscreener.sh                           # Enrichir 5 wallets"
  echo "  ./save-dexscreener.sh \"\" 10                     # Enrichir 10 wallets"
  echo "  ./save-dexscreener.sh FgNJ...pGqVN3YTXEbonk     # Enrichir un wallet spécifique"
  echo ""
  echo "Données sauvegardées:"
  echo "  - Métriques DexScreener depuis l'API enrichment_stats"
  echo "  - Market caps calculés par catégorie"
  echo "  - Données complètes JSON dans cielo_complete_data"
  echo ""
  exit 0
fi

# Exécution
main "$1" "$2"

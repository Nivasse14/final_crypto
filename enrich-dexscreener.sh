#!/bin/bash

# Script pour enrichir les wallets avec les données DexScreener complètes
# Extrait les données de market cap et les métriques DexScreener depuis cielo-api/complete

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Fonction pour analyser les market caps depuis les données API
analyze_market_caps() {
  local api_response=$1
  
  # Initialiser les compteurs
  local micro=0 low=0 middle=0 large=0 mega=0 unknown=0 total=0
  local enriched_portfolio=0 enriched_pnl=0 total_with_market_cap=0 total_with_price=0
  local total_reliability=0 reliability_count=0
  
  # Analyser les tokens portfolio enrichis
  local portfolio_tokens=$(echo "$api_response" | jq -r '.data.enriched_portfolio.enriched_tokens[]? // empty')
  
  if [ -n "$portfolio_tokens" ]; then
    echo "$api_response" | jq -r '.data.enriched_portfolio.enriched_tokens[]?' | while read -r token_json; do
      if [ -n "$token_json" ] && [ "$token_json" != "null" ]; then
        local has_dex_data=$(echo "$token_json" | jq -r '.dexscreener_enriched // false')
        
        if [ "$has_dex_data" = "true" ]; then
          ((enriched_portfolio++))
          
          local market_cap=$(echo "$token_json" | jq -r '.dexscreener_data.financial_data.market_cap // null')
          local price=$(echo "$token_json" | jq -r '.dexscreener_data.financial_data.price_usd // null')
          local reliability=$(echo "$token_json" | jq -r '.dexscreener_data.reliability_score.total_score // null')
          
          if [ "$market_cap" != "null" ] && [ "$market_cap" != "0" ]; then
            ((total_with_market_cap++))
            ((total++))
            
            # Catégoriser par market cap
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
            ((total++))
          fi
          
          if [ "$price" != "null" ] && [ "$price" != "0" ]; then
            ((total_with_price++))
          fi
          
          if [ "$reliability" != "null" ]; then
            total_reliability=$(echo "$total_reliability + $reliability" | bc -l)
            ((reliability_count++))
          fi
        fi
      fi
    done
  fi
  
  # Analyser les tokens PnL enrichis
  local pnl_tokens=$(echo "$api_response" | jq -r '.data.enriched_pnl.enriched_tokens[]? // empty')
  
  if [ -n "$pnl_tokens" ]; then
    echo "$api_response" | jq -r '.data.enriched_pnl.enriched_tokens[]?' | while read -r token_json; do
      if [ -n "$token_json" ] && [ "$token_json" != "null" ]; then
        local has_dex_data=$(echo "$token_json" | jq -r '.dexscreener_enriched // false')
        
        if [ "$has_dex_data" = "true" ]; then
          ((enriched_pnl++))
          
          local market_cap=$(echo "$token_json" | jq -r '.dexscreener_data.financial_data.market_cap // null')
          local price=$(echo "$token_json" | jq -r '.dexscreener_data.financial_data.price_usd // null')
          local reliability=$(echo "$token_json" | jq -r '.dexscreener_data.reliability_score.total_score // null')
          
          if [ "$market_cap" != "null" ] && [ "$market_cap" != "0" ]; then
            ((total_with_market_cap++))
            ((total++))
            
            # Catégoriser par market cap
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
            ((total++))
          fi
          
          if [ "$price" != "null" ] && [ "$price" != "0" ]; then
            ((total_with_price++))
          fi
          
          if [ "$reliability" != "null" ]; then
            total_reliability=$(echo "$total_reliability + $reliability" | bc -l)
            ((reliability_count++))
          fi
        fi
      fi
    done
  fi
  
  # Calculer la moyenne de fiabilité
  local avg_reliability=0
  if [ "$reliability_count" -gt 0 ]; then
    avg_reliability=$(echo "scale=2; $total_reliability / $reliability_count" | bc -l)
  fi
  
  # Retourner les données sous forme JSON
  cat <<EOF
{
  "dexscreener_enriched_portfolio_tokens": $enriched_portfolio,
  "dexscreener_enriched_pnl_tokens": $enriched_pnl,
  "dexscreener_tokens_with_market_cap": $total_with_market_cap,
  "dexscreener_tokens_with_price_data": $total_with_price,
  "dexscreener_average_reliability_score": $avg_reliability,
  "dexscreener_micro_cap_count": $micro,
  "dexscreener_low_cap_count": $low,
  "dexscreener_middle_cap_count": $middle,
  "dexscreener_large_cap_count": $large,
  "dexscreener_mega_cap_count": $mega,
  "dexscreener_unknown_cap_count": $unknown,
  "dexscreener_total_analyzed_count": $total
}
EOF
}

# Fonction pour enrichir un wallet avec DexScreener
enrich_wallet_dexscreener() {
  local wallet_address=$1
  echo "🦎 Enrichissement DexScreener pour: $wallet_address"
  
  # 1. Récupérer les données complètes via cielo-api/complete
  echo "  📊 Récupération des données via cielo-api/complete..."
  local api_response=$(curl -s "$SUPABASE_URL/functions/v1/cielo-api/complete/$wallet_address" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  if [ $? -ne 0 ] || [ -z "$api_response" ]; then
    echo "  ❌ Échec de l'appel API"
    return 1
  fi
  
  # 2. Vérifier le succès de l'API
  local success=$(echo "$api_response" | jq -r '.success // false')
  if [ "$success" != "true" ]; then
    echo "  ❌ API retourne success=false"
    return 1
  fi
  
  # 3. Analyser les données DexScreener
  echo "  🔍 Analyse des données DexScreener..."
  local dexscreener_metrics=$(analyze_market_caps "$api_response")
  
  if [ -z "$dexscreener_metrics" ]; then
    echo "  ⚠️ Aucune donnée DexScreener trouvée"
    return 1
  fi
  
  # 4. Extraire les métriques individuelles
  local enriched_portfolio=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_enriched_portfolio_tokens')
  local enriched_pnl=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_enriched_pnl_tokens')
  local tokens_with_mc=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_tokens_with_market_cap')
  local tokens_with_price=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_tokens_with_price_data')
  local avg_reliability=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_average_reliability_score')
  local micro=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_micro_cap_count')
  local low=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_low_cap_count')
  local middle=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_middle_cap_count')
  local large=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_large_cap_count')
  local mega=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_mega_cap_count')
  local unknown=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_unknown_cap_count')
  local total_analyzed=$(echo "$dexscreener_metrics" | jq -r '.dexscreener_total_analyzed_count')
  
  echo "  📊 Métriques DexScreener:"
  echo "     💰 Market Caps: Micro=$micro, Low=$low, Mid=$middle, Large=$large, Mega=$mega"
  echo "     📈 Enrichis: Portfolio=$enriched_portfolio, PnL=$enriched_pnl"
  echo "     ✅ Avec données: MC=$tokens_with_mc, Prix=$tokens_with_price"
  echo "     🎯 Fiabilité moyenne: $avg_reliability"
  
  # 5. Sauvegarder les données complètes en JSON
  local cielo_data=$(echo "$api_response" | jq -r '.data')
  
  # 6. Préparer la mise à jour en base
  local update_data=$(cat <<EOF
{
  "cielo_complete_data": $cielo_data,
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
  
  # 7. Mettre à jour en base de données
  echo "  💾 Sauvegarde en base de données..."
  local update_response=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/wallet_registry?wallet_address=eq.$wallet_address" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$update_data")
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Enrichissement DexScreener terminé pour: $wallet_address"
    echo "     💰 $total_analyzed tokens analysés ($tokens_with_mc avec market cap)"
    return 0
  else
    echo "  ❌ Échec de la sauvegarde pour: $wallet_address"
    return 1
  fi
}

# Fonction principale
main() {
  local target_wallet=$1
  local limit=${2:-10}
  
  if [ -n "$target_wallet" ]; then
    # Traiter un wallet spécifique
    echo "🦎 Enrichissement DexScreener pour le wallet: $target_wallet"
    enrich_wallet_dexscreener "$target_wallet"
  else
    # Traiter les wallets enrichis mais sans données DexScreener
    echo "🔍 Recherche des wallets à enrichir avec DexScreener..."
    
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
      if enrich_wallet_dexscreener "$wallet_address"; then
        ((enriched++))
      else
        ((failed++))
      fi
      
      # Pause entre les wallets
      sleep 3
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
  echo "🦎 Script d'enrichissement DexScreener"
  echo "======================================"
  echo ""
  echo "Usage:"
  echo "  ./enrich-dexscreener.sh [WALLET_ADDRESS] [LIMIT]"
  echo ""
  echo "Exemples:"
  echo "  ./enrich-dexscreener.sh                           # Enrichir 10 wallets"
  echo "  ./enrich-dexscreener.sh \"\" 5                      # Enrichir 5 wallets"
  echo "  ./enrich-dexscreener.sh FgNJ...pGqVN3YTXEbonk     # Enrichir un wallet spécifique"
  echo ""
  echo "Données extraites:"
  echo "  - Market caps par catégorie (micro, low, middle, large, mega)"
  echo "  - Tokens enrichis portfolio et PnL"
  echo "  - Données de prix et fiabilité"
  echo "  - Données complètes JSON dans cielo_complete_data"
  echo ""
  exit 0
fi

# Exécution
main "$1" "$2"

#!/bin/bash

# Script pour mettre à jour TOUS les wallets de la base de données
# Repasse sur chaque wallet pour s'assurer qu'il a les données les plus récentes

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleurs
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_step() {
  echo -e "${CYAN}🔄 $1${NC}"
}

log_progress() {
  echo -e "${PURPLE}📊 $1${NC}"
}

# Fonction pour mettre à jour un wallet complet
update_wallet_complete() {
  local wallet_address=$1
  local index=$2
  local total=$3
  
  log_step "[$index/$total] Mise à jour complète: $wallet_address"
  
  # 1. Appeler l'API cielo-api/complete pour récupérer les données fraîches
  local api_response=$(curl -s "$SUPABASE_URL/functions/v1/cielo-api/complete/$wallet_address" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  if [ $? -ne 0 ] || [ -z "$api_response" ]; then
    log_error "  Échec de l'appel API"
    return 1
  fi
  
  # 2. Vérifier le succès de l'API
  local success=$(echo "$api_response" | jq -r '.success // false')
  if [ "$success" != "true" ]; then
    log_warning "  API retourne success=false"
    return 1
  fi
  
  # 3. Extraire les données complètes
  local complete_data=$(echo "$api_response" | jq -r '.data')
  if [ -z "$complete_data" ] || [ "$complete_data" = "null" ]; then
    log_warning "  Pas de données complètes disponibles"
    return 1
  fi
  
  # 4. Extraire les métriques depuis les différentes sources
  local main_data=$(echo "$api_response" | jq -r '.data.main_data[4].result.data.json.data // {}')
  local pnl_data=$(echo "$api_response" | jq -r '.data.pnl_data[0].result.data.json.data // {}')
  local portfolio_data=$(echo "$api_response" | jq -r '.data.main_data[1].result.data // {}')
  local enrichment_stats=$(echo "$api_response" | jq -r '.enrichment_stats // {}')
  
  # 5. Extraire les métriques DexScreener depuis enrichment_stats
  local enriched_portfolio=$(echo "$enrichment_stats" | jq -r '.dexscreener_enriched_portfolio_tokens // 0')
  local enriched_pnl=$(echo "$enrichment_stats" | jq -r '.dexscreener_enriched_pnl_tokens // 0')
  local tokens_with_mc=$(echo "$enrichment_stats" | jq -r '.dexscreener_tokens_with_market_cap // 0')
  local tokens_with_price=$(echo "$enrichment_stats" | jq -r '.dexscreener_tokens_with_price_data // 0')
  local avg_reliability=$(echo "$enrichment_stats" | jq -r '.dexscreener_average_reliability_score // 0')
  
  # 6. Calculer les market caps par catégorie
  local micro=0 low=0 middle=0 large=0 mega=0 unknown=0 total_analyzed=0
  
  # Analyser depuis pnl_tokens si disponible
  if [ "$(echo "$api_response" | jq -r '.pnl_tokens | length')" != "null" ] && [ "$(echo "$api_response" | jq -r '.pnl_tokens | length')" -gt 0 ]; then
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
  
  # 7. Préparer la mise à jour complète avec toutes les données
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
  "cielo_last_enriched_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "dexscreener_last_enriched_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "last_updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "enriched_complete_with_dexscreener"
}
EOF
)
  
  # 8. Mettre à jour en base de données
  local update_response=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/wallet_registry?wallet_address=eq.$wallet_address" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$update_data")
  
  if [ $? -eq 0 ]; then
    log_success "  ✅ Wallet mis à jour: $enriched_pnl PnL tokens, $tokens_with_mc avec market cap"
    return 0
  else
    log_error "  ❌ Échec de la mise à jour BDD"
    return 1
  fi
}

# Fonction pour afficher le statut global
show_global_status() {
  log_step "Vérification du statut global..."
  
  local total_wallets=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  local scraped=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&status=eq.scraped" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  local enriched=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&status=eq.enriched" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  local enriched_complete=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&status=eq.enriched_complete" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  local enriched_with_dex=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&status=eq.enriched_complete_with_dexscreener" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  echo ""
  echo "📊 STATUT GLOBAL DE LA BASE DE DONNÉES"
  echo "======================================"
  echo "📋 Total wallets: $total_wallets"
  echo "🆕 Scrapés seulement: $scraped"
  echo "🔄 Enrichis basique: $enriched"  
  echo "✅ Enrichis complets: $enriched_complete"
  echo "🦎 Avec DexScreener: $enriched_with_dex"
  echo ""
}

# Fonction principale pour traiter tous les wallets
update_all_wallets() {
  local limit=${1:-50}
  local offset=${2:-0}
  local force_all=${3:-false}
  
  echo ""
  echo "🔄 MISE À JOUR GLOBALE DE TOUS LES WALLETS"
  echo "=========================================="
  echo "📊 Limite: $limit wallets"
  echo "📊 Décalage: $offset"
  echo "🔄 Force tous: $force_all"
  echo ""
  
  # Afficher le statut initial
  show_global_status
  
  # Récupérer tous les wallets selon les critères
  local query="select=wallet_address&limit=$limit&offset=$offset"
  if [ "$force_all" = "false" ]; then
    # Ne traiter que les wallets qui ont besoin d'une mise à jour
    query="$query&or=(status.neq.enriched_complete_with_dexscreener,dexscreener_last_enriched_at.is.null)"
  fi
  
  log_step "Récupération des wallets à mettre à jour..."
  local wallets=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?$query" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  local wallet_count=$(echo "$wallets" | jq '. | length')
  
  if [ "$wallet_count" -eq 0 ]; then
    log_success "Aucun wallet à mettre à jour trouvé"
    return 0
  fi
  
  log_progress "$wallet_count wallets à traiter"
  echo ""
  
  local updated=0
  local failed=0
  local index=1
  
  echo "$wallets" | jq -r '.[].wallet_address' | while read -r wallet_address; do
    if update_wallet_complete "$wallet_address" "$index" "$wallet_count"; then
      ((updated++))
    else
      ((failed++))
    fi
    
    # Pause entre les wallets
    sleep 2
    echo ""
    ((index++))
  done
  
  echo ""
  log_success "Mise à jour terminée!"
  log_progress "✅ Mis à jour: $updated"
  log_progress "❌ Échecs: $failed"
  
  # Afficher le statut final
  show_global_status
}

# Fonction pour traiter par petits lots
update_by_batches() {
  local batch_size=${1:-50}
  local max_batches=${2:-10}
  
  echo ""
  echo "🔄 MISE À JOUR PAR LOTS"
  echo "======================"
  echo "📊 Taille des lots: $batch_size"
  echo "📊 Maximum de lots: $max_batches"
  echo ""
  
  for ((i=0; i<max_batches; i++)); do
    local offset=$((i * batch_size))
    
    log_step "Lot $((i+1))/$max_batches (décalage: $offset)"
    
    # Vérifier s'il y a encore des wallets à traiter
    local remaining=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&offset=$offset" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
    
    if [ "$remaining" -eq 0 ]; then
      log_success "Plus de wallets à traiter"
      break
    fi
    
    update_all_wallets "$batch_size" "$offset"
    
    if [ $((i+1)) -lt $max_batches ]; then
      log_info "Pause de 10 secondes avant le prochain lot..."
      sleep 10
    fi
  done
  
  log_success "Traitement par lots terminé!"
}

# Fonction d'aide
show_help() {
  echo "🔄 Script de mise à jour globale de tous les wallets"
  echo "===================================================="
  echo ""
  echo "Usage:"
  echo "  ./update-all-wallets.sh [COMMAND] [OPTIONS]"
  echo ""
  echo "Commandes:"
  echo "  update [LIMIT] [OFFSET] [FORCE_ALL]"
  echo "    Met à jour les wallets avec pagination"
  echo "    FORCE_ALL=true pour forcer TOUS les wallets"
  echo ""
  echo "  batch [BATCH_SIZE] [MAX_BATCHES]"
  echo "    Traite par lots pour éviter les timeouts"
  echo "    Défaut: 50 wallets par lot, 10 lots max"
  echo ""
  echo "  status"
  echo "    Affiche juste le statut global"
  echo ""
  echo "Exemples:"
  echo "  ./update-all-wallets.sh update 50        # Met à jour 50 wallets"
  echo "  ./update-all-wallets.sh update 100 0 true # Force tous les 100 premiers"
  echo "  ./update-all-wallets.sh batch 30 15      # 15 lots de 30 wallets"
  echo "  ./update-all-wallets.sh status           # Juste le statut"
  echo ""
  echo "Recommandé pour traitement complet:"
  echo "  ./update-all-wallets.sh batch 50 15      # 750 wallets au total"
  echo ""
  echo "⚠️  ATTENTION: Ce script met à jour TOUS les wallets avec des données fraîches"
  echo "   Cela peut prendre du temps selon le nombre de wallets à traiter"
  echo ""
}

# Fonction principale
main() {
  local command=$1
  
  case "$command" in
    "update")
      update_all_wallets "$2" "$3" "$4"
      ;;
    "batch")
      update_by_batches "$2" "$3"
      ;;
    "status")
      show_global_status
      ;;
    "help"|"--help"|"-h"|"")
      show_help
      ;;
    *)
      log_error "Commande inconnue: $command"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

# Vérification des dépendances
check_dependencies() {
  local missing_deps=()
  
  # Vérifier les commandes nécessaires
  command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
  command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
  command -v bc >/dev/null 2>&1 || missing_deps+=("bc")
  
  if [ ${#missing_deps[@]} -gt 0 ]; then
    log_error "Dépendances manquantes:"
    for dep in "${missing_deps[@]}"; do
      echo "  - $dep"
    done
    exit 1
  fi
}

# Point d'entrée
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  # Vérifier les dépendances avant de commencer
  check_dependencies
  
  # Exécuter la commande
  main "$@"
fi

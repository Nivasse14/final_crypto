#!/bin/bash

# Script dédié pour l'enrichissement via cielo-api/complete
# Met à jour la base de données avec les données complètes de l'API

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Fonction pour afficher l'aide
show_help() {
  echo "🔄 Script d'enrichissement via cielo-api/complete"
  echo "==============================================="
  echo ""
  echo "🎯 Utilisation:"
  echo "  ./enrich-wallets.sh [NOMBRE] [OPTIONS]"
  echo ""
  echo "📋 Exemples:"
  echo "  ./enrich-wallets.sh 50              # Enrichir 50 wallets"
  echo "  ./enrich-wallets.sh 100 --dune-only # Enrichir 100 wallets Dune seulement"
  echo "  ./enrich-wallets.sh all              # Enrichir TOUS les wallets"
  echo "  ./enrich-wallets.sh status           # Voir le statut"
  echo ""
  echo "🔧 Options:"
  echo "  --dune-only    Enrichir seulement les wallets de source Dune"
  echo "  --pending-only Enrichir seulement les wallets en statut 'pending'"
  echo "  --force        Re-enrichir même les wallets déjà enrichis"
  echo "  --fast         Mode rapide (pause réduite entre appels)"
  echo ""
}

# Fonction pour vérifier le statut
show_status() {
  echo "📊 Statut d'enrichissement actuel"
  echo "=================================="
  
  TOTAL=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  ENRICHED=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&status=eq.enriched" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  PENDING=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&or=(status.is.null,status.neq.enriched)" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  DUNE_PENDING=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper&or=(status.is.null,status.neq.enriched)" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  echo "   📈 Total wallets: $TOTAL"
  echo "   ✅ Enrichis: $ENRICHED ($(echo "scale=1; $ENRICHED * 100 / $TOTAL" | bc)%)"
  echo "   ⏳ En attente: $PENDING"
  echo "   🕷️ Wallets Dune en attente: $DUNE_PENDING"
  echo ""
  
  if [ "$PENDING" -gt 0 ]; then
    echo "💡 Commandes suggérées:"
    echo "   ./enrich-wallets.sh $DUNE_PENDING --dune-only  # Enrichir tous les Dune"
    echo "   ./enrich-wallets.sh 50                         # Enrichir 50 wallets"
  fi
}

# Fonction principale d'enrichissement
enrich_wallets() {
  local limit=$1
  local filter_dune=$2
  local filter_pending=$3
  local force_mode=$4
  local fast_mode=$5
  
  echo "🔄 Enrichissement des wallets via cielo-api/complete"
  echo "=================================================="
  
  # Construire la requête de base
  local query="select=id,wallet_address,status"
  
  # Filtres
  if [ "$filter_dune" = "true" ]; then
    query="$query&source=eq.dune_scraper"
    echo "🕷️ Mode: Wallets Dune seulement"
  fi
  
  if [ "$filter_pending" = "true" ] && [ "$force_mode" != "true" ]; then
    query="$query&or=(status.is.null,status.neq.enriched)"
    echo "⏳ Mode: Wallets en attente seulement"
  elif [ "$force_mode" = "true" ]; then
    echo "🔥 Mode: Force (re-enrichir tous)"
  fi
  
  if [ "$limit" != "all" ]; then
    query="$query&limit=$limit"
    echo "📊 Limite: $limit wallets"
  else
    echo "📊 Mode: TOUS les wallets"
  fi
  
  # Pause entre appels
  local pause_time=2
  if [ "$fast_mode" = "true" ]; then
    pause_time=1
    echo "⚡ Mode rapide activé"
  fi
  
  echo ""
  
  # Récupérer les wallets à enrichir
  local wallets_response=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?$query" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  local wallet_count=$(echo "$wallets_response" | jq '. | length')
  
  if [ "$wallet_count" -eq 0 ]; then
    echo "ℹ️ Aucun wallet à enrichir avec ces critères"
    return 0
  fi
  
  echo "📊 $wallet_count wallets à enrichir..."
  echo ""
  
  local enriched=0
  local failed=0
  local start_time=$(date +%s)
  
  # Traiter chaque wallet
  echo "$wallets_response" | jq -r '.[] | "\(.id)|\(.wallet_address)|\(.status // "null")"' | while IFS='|' read -r id address current_status; do
    local wallet_num=$((enriched + failed + 1))
    echo "[$wallet_num/$wallet_count] 🔄 Enrichissement $address..."
    
    # Appel à l'API cielo-api/complete
    local response=$(curl -s -w "%{http_code}" \
      "$SUPABASE_URL/functions/v1/cielo-api/complete/$address" \
      -H "Authorization: Bearer $SUPABASE_KEY")
    
    local http_code="${response: -3}"
    local response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
      # Marquer comme enrichi
      local update_response=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/wallet_registry?id=eq.$id" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"status": "enriched", "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}')
      
      echo "[$wallet_num/$wallet_count] ✅ $address enrichi avec succès"
      ((enriched++))
    else
      echo "[$wallet_num/$wallet_count] ❌ Échec $address (code: $http_code)"
      ((failed++))
      
      # En cas d'erreur 429 (rate limit), attendre plus longtemps
      if [ "$http_code" = "429" ]; then
        echo "⏸️ Rate limit détecté, pause de 10s..."
        sleep 10
      fi
    fi
    
    # Pause entre les appels
    sleep $pause_time
    
    # Affichage du progrès tous les 10 wallets
    if [ $((wallet_num % 10)) -eq 0 ]; then
      local elapsed=$(($(date +%s) - start_time))
      local rate=$(echo "scale=2; $wallet_num / $elapsed" | bc 2>/dev/null || echo "0")
      echo "📊 Progrès: $wallet_num/$wallet_count | ✅ $enriched | ❌ $failed | ⚡ ${rate}/s"
    fi
  done
  
  local end_time=$(date +%s)
  local total_time=$((end_time - start_time))
  
  echo ""
  echo "🎯 Enrichissement terminé!"
  echo "========================="
  echo "   ✅ Réussis: $enriched"
  echo "   ❌ Échecs: $failed"
  echo "   ⏱️ Durée: ${total_time}s"
  echo "   ⚡ Vitesse: $(echo "scale=2; $wallet_count / $total_time" | bc 2>/dev/null || echo "0") wallets/s"
}

# Parse des arguments
LIMIT=${1:-50}
DUNE_ONLY=false
PENDING_ONLY=true  # Par défaut, enrichir seulement les pending
FORCE_MODE=false
FAST_MODE=false

# Parse des options
for arg in "$@"; do
  case $arg in
    --dune-only)
      DUNE_ONLY=true
      shift
      ;;
    --pending-only)
      PENDING_ONLY=true
      shift
      ;;
    --force)
      FORCE_MODE=true
      PENDING_ONLY=false
      shift
      ;;
    --fast)
      FAST_MODE=true
      shift
      ;;
    help|--help|-h)
      show_help
      exit 0
      ;;
    status|--status)
      show_status
      exit 0
      ;;
  esac
done

# Validation des arguments
case "$LIMIT" in
  help|--help|-h)
    show_help
    ;;
  status|--status)
    show_status
    ;;
  [0-9]*)
    enrich_wallets "$LIMIT" "$DUNE_ONLY" "$PENDING_ONLY" "$FORCE_MODE" "$FAST_MODE"
    ;;
  all)
    enrich_wallets "all" "$DUNE_ONLY" "$PENDING_ONLY" "$FORCE_MODE" "$FAST_MODE"
    ;;
  *)
    echo "❌ Argument invalide: $LIMIT"
    echo "💡 Utilisez: ./enrich-wallets.sh help"
    exit 1
    ;;
esac

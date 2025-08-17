#!/bin/bash

# Script consolidé pour le workflow complet d'enrichissement
# Combine scraping Dune + enrichissement Cielo + données DexScreener + corrections

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Fonction pour afficher le statut global
show_status() {
  log_step "Vérification du statut global de la base de données..."
  
  # Compter les wallets par statut
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

# Fonction pour scraper de nouveaux wallets
scrape_new_wallets() {
  local limit=${1:-50}
  log_step "Étape 1: Scraping de nouveaux wallets (limite: $limit)"
  
  if [ ! -f "./dune-workflow.sh" ]; then
    log_error "Script dune-workflow.sh introuvable"
    return 1
  fi
  
  log_info "Lancement du scraping Dune..."
  ./dune-workflow.sh "$limit"
  
  if [ $? -eq 0 ]; then
    log_success "Scraping terminé avec succès"
    return 0
  else
    log_error "Échec du scraping"
    return 1
  fi
}

# Fonction pour enrichir les wallets scrapés
enrich_scraped_wallets() {
  local limit=${1:-20}
  log_step "Étape 2: Enrichissement des wallets scrapés (limite: $limit)"
  
  # Récupérer les wallets scrapés mais pas enrichis
  local scraped_wallets=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=wallet_address&status=eq.scraped&limit=$limit" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  local wallet_count=$(echo "$scraped_wallets" | jq '. | length')
  
  if [ "$wallet_count" -eq 0 ]; then
    log_warning "Aucun wallet scrapé à enrichir"
    return 0
  fi
  
  log_info "$wallet_count wallets scrapés à enrichir"
  
  local enriched=0
  local failed=0
  
  echo "$scraped_wallets" | jq -r '.[].wallet_address' | while read -r wallet_address; do
    echo "  🔄 Enrichissement: $wallet_address"
    
    # Appeler l'API wallet-enrichment
    local enrich_response=$(curl -s "$SUPABASE_URL/functions/v1/wallet-enrichment/$wallet_address" \
      -H "Authorization: Bearer $SUPABASE_KEY")
    
    local success=$(echo "$enrich_response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
      ((enriched++))
      echo "    ✅ Enrichi avec succès"
    else
      ((failed++))
      echo "    ❌ Échec de l'enrichissement"
    fi
    
    # Pause pour éviter de surcharger l'API
    sleep 3
  done
  
  log_success "Enrichissement terminé: $enriched réussis, $failed échecs"
  return 0
}

# Fonction pour corriger les enrichissements défaillants
fix_broken_enrichments() {
  log_step "Étape 3: Correction des enrichissements défaillants"
  
  if [ ! -f "./fix-enrichment.sh" ]; then
    log_error "Script fix-enrichment.sh introuvable"
    return 1
  fi
  
  log_info "Lancement de la correction des enrichissements..."
  ./fix-enrichment.sh
  
  if [ $? -eq 0 ]; then
    log_success "Correction des enrichissements terminée"
    return 0
  else
    log_error "Échec de la correction des enrichissements"
    return 1
  fi
}

# Fonction pour ajouter les données DexScreener
add_dexscreener_data() {
  local limit=${1:-30}
  log_step "Étape 4: Ajout des données DexScreener (limite: $limit)"
  
  if [ ! -f "./save-dexscreener.sh" ]; then
    log_error "Script save-dexscreener.sh introuvable"
    return 1
  fi
  
  log_info "Lancement de l'enrichissement DexScreener..."
  ./save-dexscreener.sh "" "$limit"
  
  if [ $? -eq 0 ]; then
    log_success "Enrichissement DexScreener terminé"
    return 0
  else
    log_error "Échec de l'enrichissement DexScreener"
    return 1
  fi
}

# Fonction pour nettoyer et valider les données
validate_and_cleanup() {
  log_step "Étape 5: Validation et nettoyage des données"
  
  # Compter les wallets avec des données incomplètes
  local incomplete_enriched=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&status=eq.enriched&enriched_total_pnl_usd=is.null" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')
  
  if [ "$incomplete_enriched" -gt 0 ]; then
    log_warning "$incomplete_enriched wallets avec enrichissement incomplet détectés"
    log_info "Lancement d'une correction supplémentaire..."
    ./fix-enrichment.sh
  fi
  
  # Compter les doublons potentiels
  local potential_duplicates=$(curl -s "$SUPABASE_URL/rest/v1/rpc/check_duplicate_wallets" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
  
  if [ "$potential_duplicates" -gt 0 ]; then
    log_warning "$potential_duplicates doublons potentiels détectés"
  fi
  
  log_success "Validation terminée"
}

# Fonction pour workflow complet
run_complete_workflow() {
  local scrape_limit=${1:-50}
  local enrich_limit=${2:-20}
  local dexscreener_limit=${3:-30}
  
  echo ""
  echo "🚀 WORKFLOW COMPLET D'ENRICHISSEMENT"
  echo "====================================="
  echo "🆕 Scraping: $scrape_limit nouveaux wallets"
  echo "🔄 Enrichissement: $enrich_limit wallets"
  echo "🦎 DexScreener: $dexscreener_limit wallets"
  echo ""
  
  # Afficher le statut initial
  show_status
  
  # Étape 1: Scraper nouveaux wallets
  if scrape_new_wallets "$scrape_limit"; then
    sleep 5
  else
    log_error "Arrêt du workflow à cause de l'échec du scraping"
    return 1
  fi
  
  # Étape 2: Enrichir les wallets scrapés
  if enrich_scraped_wallets "$enrich_limit"; then
    sleep 5
  else
    log_warning "Échec de l'enrichissement, mais on continue..."
  fi
  
  # Étape 3: Corriger les enrichissements défaillants
  if fix_broken_enrichments; then
    sleep 5
  else
    log_warning "Échec de la correction, mais on continue..."
  fi
  
  # Étape 4: Ajouter les données DexScreener
  if add_dexscreener_data "$dexscreener_limit"; then
    sleep 5
  else
    log_warning "Échec de l'enrichissement DexScreener, mais on continue..."
  fi
  
  # Étape 5: Validation finale
  validate_and_cleanup
  
  # Afficher le statut final
  echo ""
  show_status
  
  log_success "Workflow complet terminé!"
}

# Fonction pour workflow partiel (enrichissement seulement)
run_enrichment_only() {
  local enrich_limit=${1:-20}
  local dexscreener_limit=${2:-30}
  
  echo ""
  echo "🔄 WORKFLOW D'ENRICHISSEMENT SEULEMENT"
  echo "======================================="
  echo "🔄 Enrichissement: $enrich_limit wallets"
  echo "🦎 DexScreener: $dexscreener_limit wallets"
  echo ""
  
  show_status
  
  # Enrichir les wallets existants
  enrich_scraped_wallets "$enrich_limit"
  sleep 3
  
  # Corriger les enrichissements défaillants
  fix_broken_enrichments
  sleep 3
  
  # Ajouter les données DexScreener
  add_dexscreener_data "$dexscreener_limit"
  sleep 3
  
  # Validation finale
  validate_and_cleanup
  
  echo ""
  show_status
  
  log_success "Workflow d'enrichissement terminé!"
}

# Fonction pour workflow DexScreener seulement
run_dexscreener_only() {
  local limit=${1:-50}
  
  echo ""
  echo "🦎 WORKFLOW DEXSCREENER SEULEMENT"
  echo "=================================="
  echo "🦎 DexScreener: $limit wallets"
  echo ""
  
  show_status
  
  add_dexscreener_data "$limit"
  
  echo ""
  show_status
  
  log_success "Workflow DexScreener terminé!"
}

# Fonction d'aide
show_help() {
  echo "🚀 Script consolidé d'enrichissement de wallets"
  echo "================================================"
  echo ""
  echo "Usage:"
  echo "  ./enrichment-complete-workflow.sh [COMMAND] [OPTIONS]"
  echo ""
  echo "Commandes:"
  echo "  complete [SCRAPE_LIMIT] [ENRICH_LIMIT] [DEX_LIMIT]"
  echo "    Workflow complet: scraping + enrichissement + DexScreener"
  echo "    Défaut: 50 scrape, 20 enrich, 30 dex"
  echo ""
  echo "  enrich [ENRICH_LIMIT] [DEX_LIMIT]"
  echo "    Enrichissement seulement (pas de scraping)"
  echo "    Défaut: 20 enrich, 30 dex"
  echo ""
  echo "  dexscreener [LIMIT]"
  echo "    DexScreener seulement"
  echo "    Défaut: 50"
  echo ""
  echo "  status"
  echo "    Afficher le statut de la base de données"
  echo ""
  echo "  fix"
  echo "    Corriger les enrichissements défaillants seulement"
  echo ""
  echo "Exemples:"
  echo "  ./enrichment-complete-workflow.sh complete          # Workflow complet avec limites par défaut"
  echo "  ./enrichment-complete-workflow.sh complete 100 50 50  # Workflow complet avec limites custom"
  echo "  ./enrichment-complete-workflow.sh enrich 30 40      # Enrichissement avec 30 enrich + 40 dex"
  echo "  ./enrichment-complete-workflow.sh dexscreener 100   # DexScreener sur 100 wallets"
  echo "  ./enrichment-complete-workflow.sh status            # Juste le statut"
  echo "  ./enrichment-complete-workflow.sh fix               # Juste les corrections"
  echo ""
  echo "Workflow recommandé:"
  echo "  1. ./enrichment-complete-workflow.sh complete 100   # Pour scraper et enrichir massivement"
  echo "  2. ./enrichment-complete-workflow.sh enrich 50      # Pour enrichir les existants"
  echo "  3. ./enrichment-complete-workflow.sh dexscreener 100 # Pour compléter avec DexScreener"
  echo ""
}

# Main function
main() {
  local command=$1
  
  case "$command" in
    "complete")
      run_complete_workflow "$2" "$3" "$4"
      ;;
    "enrich")
      run_enrichment_only "$2" "$3"
      ;;
    "dexscreener")
      run_dexscreener_only "$2"
      ;;
    "status")
      show_status
      ;;
    "fix")
      fix_broken_enrichments
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
  
  # Vérifier les scripts nécessaires
  [ ! -f "./dune-workflow.sh" ] && missing_deps+=("dune-workflow.sh")
  [ ! -f "./fix-enrichment.sh" ] && missing_deps+=("fix-enrichment.sh")
  [ ! -f "./save-dexscreener.sh" ] && missing_deps+=("save-dexscreener.sh")
  
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

#!/bin/bash

# Script simple pour lancer le workflow Dune depuis votre Mac
# Utilise l'API locale sur le port 3001

API_BASE="http://localhost:3001"

echo "🚀 Script d'automatisation Dune - Workflow complet"
echo "================================================="

# Fonction pour vérifier si l'API locale tourne
check_api() {
  curl -s "$API_BASE/health" > /dev/null
  return $?
}

# Fonction pour démarrer l'API locale si elle n'est pas running
start_api_if_needed() {
  if ! check_api; then
    echo "⚠️  API locale non détectée, démarrage..."
    cd "$(dirname "$0")"
    
    # Installer les dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
      echo "📦 Installation des dépendances..."
      npm install express
    fi
    
    # Démarrer l'API en arrière-plan
    echo "🔄 Démarrage de l'API locale..."
    node local-api.js &
    API_PID=$!
    
    # Attendre que l'API soit prête
    echo "⏳ Attente du démarrage de l'API..."
    for i in {1..10}; do
      sleep 2
      if check_api; then
        echo "✅ API locale prête!"
        break
      fi
      if [ $i -eq 10 ]; then
        echo "❌ Timeout: API locale ne répond pas"
        exit 1
      fi
    done
  else
    echo "✅ API locale déjà en cours"
  fi
}

# Fonction pour démarrer le workflow complet
start_workflow() {
  echo ""
  echo "🤖 Démarrage du workflow complet..."
  
  RESPONSE=$(curl -s -X POST \
    "$API_BASE/full-workflow" \
    -H "Content-Type: application/json" \
    -d '{"enrichment_limit": 50}')
  
  echo "$RESPONSE" | jq '.'
  
  # Extraire le job ID pour le suivi
  SCRAPING_JOB_ID=$(echo "$RESPONSE" | jq -r '.scraping_job_id // empty')
  
  if [ -n "$SCRAPING_JOB_ID" ]; then
    echo ""
    echo "📊 Suivi du scraping Job ID: $SCRAPING_JOB_ID"
    echo "⏳ Surveillance en cours..."
    
    # Surveiller le statut
    for i in {1..20}; do
      sleep 30
      
      STATUS_RESPONSE=$(curl -s "$API_BASE/job-status/$SCRAPING_JOB_ID")
      STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"')
      
      echo "[$i] Statut: $STATUS"
      
      if [ "$STATUS" = "completed" ]; then
        echo ""
        echo "✅ Scraping terminé avec succès!"
        echo "🔄 Vous pouvez maintenant lancer l'enrichissement:"
        echo "   curl -X POST $API_BASE/start-enrichment -d '{\"limit\": 50}'"
        break
      elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo "❌ Scraping échoué:"
        echo "$STATUS_RESPONSE" | jq '.error'
        break
      fi
      
      if [ $i -eq 20 ]; then
        echo ""
        echo "⏰ Timeout surveillance (10 minutes)"
        echo "📊 Vérifiez manuellement: curl $API_BASE/job-status/$SCRAPING_JOB_ID"
      fi
    done
  fi
}

# Fonction pour démarrer seulement l'enrichissement
start_enrichment_only() {
  local limit=${1:-50}
  
  echo ""
  echo "🔄 Démarrage enrichissement seulement ($limit wallets)..."
  
  curl -s -X POST \
    "$API_BASE/start-enrichment" \
    -H "Content-Type: application/json" \
    -d "{\"limit\": $limit}" | jq '.'
}

# Fonction pour afficher le statut
show_status() {
  echo ""
  echo "📊 Jobs actifs:"
  curl -s "$API_BASE/jobs" | jq '.jobs'
}

# Menu principal
case "${1:-menu}" in
  "start"|"workflow")
    start_api_if_needed
    start_workflow
    ;;
  "enrich")
    LIMIT=${2:-50}
    start_api_if_needed
    start_enrichment_only $LIMIT
    ;;
  "status")
    if check_api; then
      show_status
    else
      echo "❌ API locale non accessible sur $API_BASE"
    fi
    ;;
  "health")
    if check_api; then
      curl -s "$API_BASE/health" | jq '.'
    else
      echo "❌ API locale non accessible sur $API_BASE"
    fi
    ;;
  "stop")
    echo "🛑 Arrêt de l'API locale..."
    pkill -f "node local-api.js"
    echo "✅ API arrêtée"
    ;;
  *)
    echo "🎯 Utilisation:"
    echo "  ./dune-workflow.sh start     - Workflow complet (scraping + enrichissement)"
    echo "  ./dune-workflow.sh enrich [N] - Enrichissement seulement (N wallets, défaut: 50)"
    echo "  ./dune-workflow.sh status    - Voir les jobs en cours"
    echo "  ./dune-workflow.sh health    - Vérifier l'API"
    echo "  ./dune-workflow.sh stop      - Arrêter l'API locale"
    echo ""
    echo "📋 Exemples:"
    echo "  ./dune-workflow.sh start           # Workflow complet"
    echo "  ./dune-workflow.sh enrich 100      # Enrichir 100 wallets"
    echo "  ./dune-workflow.sh status          # Voir le statut"
    ;;
esac

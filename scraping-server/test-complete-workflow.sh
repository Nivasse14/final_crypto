#!/bin/bash

# Script de test pour le workflow complet : scraping + enrichissement

echo "🚀 Test du workflow complet Dune Scraping + Enrichissement"
echo "============================================================"

# Configuration
SERVER_URL="http://localhost:3000"
AUTH_TOKEN="default-token"
JOB_ID="workflow-test-$(date +%s)"
DUNE_URL="https://dune.com/ilemi/solana-top-traders"

echo "📋 Configuration:"
echo "  - Serveur: $SERVER_URL"
echo "  - Job ID: $JOB_ID"
echo "  - URL Dune: $DUNE_URL"
echo ""

# Test 1: Vérifier que le serveur fonctionne
echo "🔍 Test 1: Vérification du serveur..."
HEALTH_RESPONSE=$(curl -s "$SERVER_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Serveur opérationnel"
else
    echo "❌ Serveur non disponible"
    exit 1
fi
echo ""

# Test 2: Démarrer le workflow complet
echo "🚀 Test 2: Démarrage du workflow complet..."
WORKFLOW_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/start-complete-workflow" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"url\": \"$DUNE_URL\",
    \"auto_enrich\": true,
    \"enrich_delay\": 10
  }")

echo "Réponse: $WORKFLOW_RESPONSE"

if echo "$WORKFLOW_RESPONSE" | grep -q "success"; then
    echo "✅ Workflow démarré avec succès"
else
    echo "❌ Erreur lors du démarrage du workflow"
    exit 1
fi
echo ""

# Test 3: Surveillance du statut
echo "📊 Test 3: Surveillance du workflow..."
for i in {1..20}; do
    echo "⏳ Vérification $i/20..."
    
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$SERVER_URL/api/job-status/$JOB_ID")
    
    STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "  Statut: $STATUS"
    
    # Afficher les détails des stages si disponibles
    if echo "$STATUS_RESPONSE" | grep -q "stages"; then
        echo "  📋 Stages du workflow:"
        echo "$STATUS_RESPONSE" | grep -o '"scraping":{[^}]*}' | sed 's/.*"status":"\([^"]*\)".*/    - Scraping: \1/'
        echo "$STATUS_RESPONSE" | grep -o '"enrichment":{[^}]*}' | sed 's/.*"status":"\([^"]*\)".*/    - Enrichissement: \1/'
    fi
    
    if [ "$STATUS" = "completed" ]; then
        echo "✅ Workflow terminé avec succès !"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ Workflow échoué"
        echo "Détails: $STATUS_RESPONSE"
        exit 1
    fi
    
    sleep 30
done
echo ""

# Test 4: Vérification des résultats
echo "📈 Test 4: Vérification des résultats..."
RESULTS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$SERVER_URL/api/job-results/$JOB_ID")

if echo "$RESULTS_RESPONSE" | grep -q "wallets_count"; then
    WALLET_COUNT=$(echo "$RESULTS_RESPONSE" | grep -o '"wallets_count":[0-9]*' | cut -d':' -f2)
    echo "✅ $WALLET_COUNT wallets scrapés"
    
    # Vérifier l'enrichissement
    if echo "$RESULTS_RESPONSE" | grep -q "enrichment_results"; then
        ENRICHED_COUNT=$(echo "$RESULTS_RESPONSE" | grep -o '"enriched_count":[0-9]*' | cut -d':' -f2)
        ERROR_COUNT=$(echo "$RESULTS_RESPONSE" | grep -o '"error_count":[0-9]*' | cut -d':' -f2)
        echo "✅ Enrichissement: $ENRICHED_COUNT réussis, $ERROR_COUNT erreurs"
    else
        echo "⚠️ Pas de résultats d'enrichissement trouvés"
    fi
else
    echo "❌ Aucun résultat trouvé"
    echo "Réponse: $RESULTS_RESPONSE"
fi
echo ""

# Test 5: Vérification dans Supabase
echo "🗃️ Test 5: Vérification des données dans Supabase..."
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# Compter les wallets dans wallet_registry
WALLET_REGISTRY_COUNT=$(curl -s \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" \
  "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper_api" | \
  grep -o '"count":[0-9]*' | cut -d':' -f2)

echo "📊 Wallets dans wallet_registry: $WALLET_REGISTRY_COUNT"

# Compter les wallets enrichis
ENRICHED_COUNT_DB=$(curl -s \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" \
  "$SUPABASE_URL/rest/v1/wallets_extended?select=count" | \
  grep -o '"count":[0-9]*' | cut -d':' -f2)

echo "📊 Wallets enrichis dans wallets_extended: $ENRICHED_COUNT_DB"

echo ""
echo "🎉 Test du workflow complet terminé !"
echo "📋 Résumé:"
echo "  - Job ID: $JOB_ID"
echo "  - Dashboard: $SERVER_URL/dashboard"
echo "  - Supabase: https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor/28888"

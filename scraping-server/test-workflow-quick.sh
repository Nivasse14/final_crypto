#!/bin/bash

# Test rapide du workflow complet avec données simulées

echo "🚀 Test du workflow complet"
echo "=========================="

SERVER_URL="http://localhost:3002"
AUTH_TOKEN="default-token"
JOB_ID="workflow-demo-$(date +%s)"

echo "🔍 Test 1: Workflow complet (scraping + enrichissement auto)"
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/start-complete-workflow" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"url\": \"https://dune.com/ilemi/solana-top-traders\",
    \"auto_enrich\": true,
    \"enrich_delay\": 5
  }")

echo "Réponse workflow: $RESPONSE"
echo ""

echo "🔍 Test 2: Enrichissement manuel d'un job existant"
# Utiliser un job existant (remplacez par un vrai job ID si disponible)
EXISTING_JOB="test-mock-data-persistence"

ENRICH_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/enrich-job/$EXISTING_JOB" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"force": true}')

echo "Réponse enrichissement: $ENRICH_RESPONSE"
echo ""

echo "📊 Test 3: Voir tous les jobs"
ALL_JOBS=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/jobs")
echo "Jobs disponibles: $ALL_JOBS"
echo ""

echo "🎉 Tests terminés !"
echo "📋 Dashboard: $SERVER_URL/dashboard"

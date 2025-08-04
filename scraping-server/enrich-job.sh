#!/bin/bash

# Script pour déclencher manuellement l'enrichissement d'un job existant

echo "🔍 Enrichissement manuel d'un job existant"
echo "=========================================="

# Configuration
SERVER_URL="http://localhost:3000"
AUTH_TOKEN="default-token"

# Demander le Job ID
if [ -z "$1" ]; then
    echo "Usage: $0 <JOB_ID> [force]"
    echo ""
    echo "📋 Jobs disponibles:"
    curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/jobs" | \
        grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -10
    echo ""
    echo "Exemple: $0 test-solana-wallets-001"
    exit 1
fi

JOB_ID="$1"
FORCE="$2"

echo "📋 Configuration:"
echo "  - Job ID: $JOB_ID"
echo "  - Force: ${FORCE:-false}"
echo ""

# Vérifier le statut du job
echo "🔍 Vérification du job existant..."
STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$SERVER_URL/api/job-status/$JOB_ID")

if echo "$STATUS_RESPONSE" | grep -q "error"; then
    echo "❌ Job non trouvé: $JOB_ID"
    exit 1
fi

STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
WALLET_COUNT=$(echo "$STATUS_RESPONSE" | grep -o '"wallets_count":[0-9]*' | cut -d':' -f2)

echo "✅ Job trouvé:"
echo "  - Statut: $STATUS"
echo "  - Wallets: $WALLET_COUNT"
echo ""

# Démarrer l'enrichissement
echo "🚀 Démarrage de l'enrichissement..."

REQUEST_BODY="{\"force\": $([ "$FORCE" = "force" ] && echo "true" || echo "false")}"

ENRICH_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/enrich-job/$JOB_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$REQUEST_BODY")

echo "Réponse: $ENRICH_RESPONSE"

if echo "$ENRICH_RESPONSE" | grep -q "success"; then
    echo "✅ Enrichissement démarré avec succès"
    
    ESTIMATED_DURATION=$(echo "$ENRICH_RESPONSE" | grep -o '"estimated_duration":"[^"]*"' | cut -d'"' -f4)
    echo "⏱️ Durée estimée: $ESTIMATED_DURATION"
else
    echo "❌ Erreur lors du démarrage de l'enrichissement"
    exit 1
fi
echo ""

# Surveillance de l'enrichissement
echo "📊 Surveillance de l'enrichissement..."
for i in {1..20}; do
    echo "⏳ Vérification $i/20..."
    
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
        "$SERVER_URL/api/job-status/$JOB_ID")
    
    # Vérifier le statut de l'enrichissement
    if echo "$STATUS_RESPONSE" | grep -q "enrichment_results"; then
        ENRICHED_COUNT=$(echo "$STATUS_RESPONSE" | grep -o '"enriched_count":[0-9]*' | cut -d':' -f2)
        ERROR_COUNT=$(echo "$STATUS_RESPONSE" | grep -o '"error_count":[0-9]*' | cut -d':' -f2)
        SUCCESS_RATE=$(echo "$STATUS_RESPONSE" | grep -o '"success_rate":[0-9]*' | cut -d':' -f2)
        
        echo "✅ Enrichissement terminé !"
        echo "📊 Résultats:"
        echo "  - Enrichis: $ENRICHED_COUNT"
        echo "  - Erreurs: $ERROR_COUNT" 
        echo "  - Taux de réussite: $SUCCESS_RATE%"
        break
    fi
    
    if echo "$STATUS_RESPONSE" | grep -q "enrichment.*running"; then
        echo "  🔄 Enrichissement en cours..."
    elif echo "$STATUS_RESPONSE" | grep -q "enrichment.*failed"; then
        echo "❌ Enrichissement échoué"
        break
    fi
    
    sleep 15
done
echo ""

echo "🎉 Enrichissement terminé !"
echo "📋 Dashboard: $SERVER_URL/dashboard"

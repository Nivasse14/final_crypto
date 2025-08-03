#!/bin/bash

echo "🚀 TEST COMPLET DE L'API COMPLETE ANALYSIS"
echo "=========================================="

# Configuration
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
WALLET_ADDRESS="HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH"

echo "👛 Wallet à analyser: $WALLET_ADDRESS"
echo ""

# 1. Vérifier que l'API est accessible
echo "🏥 1. Health Check..."
curl -s -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/functions/v1/wallet-analyzer/health" | jq '.'

echo ""

# 2. Lancer l'analyse complète
echo "🚀 2. Lancement de l'analyse complète..."
echo "Request: POST $SUPABASE_URL/functions/v1/wallet-analyzer/complete/$WALLET_ADDRESS"

RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/wallet-analyzer/complete/$WALLET_ADDRESS")

echo "Response:"
echo "$RESPONSE" | jq '.'

# Extraire le job_id si présent
JOB_ID=$(echo "$RESPONSE" | jq -r '.job_id // empty')

if [ -z "$JOB_ID" ]; then
    echo ""
    echo "❌ Pas de job_id reçu. Possible erreur:"
    echo "   - Table analysis_jobs manquante"
    echo "   - Erreur dans l'API"
    echo ""
    echo "🔧 SOLUTION: Créer la table analysis_jobs avec le script SQL"
    exit 1
fi

echo ""
echo "✅ Job créé avec l'ID: $JOB_ID"
echo ""

# 3. Suivre le progrès
echo "👀 3. Suivi du progrès..."
echo "Request: GET $SUPABASE_URL/functions/v1/wallet-analyzer/status/$JOB_ID"

for i in {1..20}; do
    echo ""
    echo "📊 Check #$i..."
    
    STATUS_RESPONSE=$(curl -s \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      "$SUPABASE_URL/functions/v1/wallet-analyzer/status/$JOB_ID")
    
    echo "$STATUS_RESPONSE" | jq '.'
    
    # Vérifier le statut
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.progress_percentage')
    STEP=$(echo "$STATUS_RESPONSE" | jq -r '.current_step')
    
    echo "Status: $STATUS | Progress: $PROGRESS% | Step: $STEP"
    
    if [ "$STATUS" = "completed" ]; then
        echo ""
        echo "🎉 ANALYSE TERMINÉE AVEC SUCCÈS !"
        echo "📊 Résultats complets disponibles dans la réponse ci-dessus"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo "❌ ANALYSE ÉCHOUÉE"
        ERROR_MSG=$(echo "$STATUS_RESPONSE" | jq -r '.error_message')
        echo "💥 Erreur: $ERROR_MSG"
        break
    fi
    
    # Attendre 5 secondes avant le prochain check
    echo "⏳ Attente 5 secondes..."
    sleep 5
done

echo ""
echo "✅ Test terminé !"
